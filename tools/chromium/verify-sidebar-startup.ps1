[CmdletBinding()]
param(
    [string]$Executable = 'C:\src\atlas-chromium\src\out\AtlasRelease\chrome.exe',
    [int]$ObserveSeconds = 8
)

$ErrorActionPreference = 'Stop'
$executablePath = (Resolve-Path -LiteralPath $Executable).Path
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('atlas-sidebar-check-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
$results = @()
foreach ($collapsed in @($false, $true)) {
    foreach ($maximized in @($false, $true)) {
        $name = 'collapsed-{0}-maximized-{1}' -f $collapsed, $maximized
        $profile = Join-Path $testRoot $name
        $default = Join-Path $profile 'Default'
        New-Item -ItemType Directory -Path $default -Force | Out-Null
        # A crashed previous session requests an app-menu-anchored recovery
        # bubble on startup: this exercises the original hidden-anchor crash.
        $preferences = @{
            vertical_tabs = @{ collapsed_state = $collapsed; uncollapsed_width = 240 }
            profile = @{ exit_type = 'Crashed'; exited_cleanly = $false }
            browser = @{ window_placement = @{
                bottom = 800; left = 100; right = 1200; top = 100
                maximized = $maximized
                work_area_bottom = 1040; work_area_left = 0
                work_area_right = 1920; work_area_top = 0
            } }
        }
        $preferences | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $default 'Preferences') -Encoding utf8
        $log = Join-Path $profile 'chrome_debug.log'
        $arguments = @(
            ('--user-data-dir="{0}"' -f $profile), '--no-first-run',
            '--no-default-browser-check', '--disable-background-networking',
            '--enable-logging', ('--log-file="{0}"' -f $log), 'about:blank'
        )
        if ($maximized) { $arguments += '--start-maximized' }
        $process = Start-Process -FilePath $executablePath -ArgumentList $arguments -PassThru
        try {
            Start-Sleep -Seconds $ObserveSeconds
            $process.Refresh()
            $alive = -not $process.HasExited
            $windowVisible = $alive -and $process.MainWindowHandle -ne 0
            $fatal = if (Test-Path -LiteralPath $log) {
                @(Select-String -LiteralPath $log -Pattern 'FATAL:|Check failed:').Count -gt 0
            } else { $false }
            $result = [pscustomobject]@{
                Case = $name; Alive = $alive; Window = $windowVisible
                Fatal = $fatal; Passed = ($alive -and $windowVisible -and -not $fatal)
            }
            $results += $result
            $result | Format-List | Out-Host
        } finally {
            # Only processes whose command line carries this unique test
            # directory belong to us. Never terminate the user's Atlas/Chrome.
            Get-CimInstance Win32_Process | Where-Object {
                $_.ExecutablePath -eq $executablePath -and $_.CommandLine.Contains($profile)
            } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        }
    }
}
$results | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $testRoot 'results.json') -Encoding utf8
Write-Output "Test profiles and logs: $testRoot"
if (@($results | Where-Object { -not $_.Passed }).Count) {
    throw 'Sidebar startup regression detected. See the retained logs.'
}
