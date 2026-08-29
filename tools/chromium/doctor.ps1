[CmdletBinding()]
param(
    [string]$CheckoutRoot = "C:\src\atlas-chromium"
)

$ErrorActionPreference = "Stop"
$results = [System.Collections.Generic.List[object]]::new()

function Add-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Details
    )

    $results.Add([pscustomobject]@{
        Status = if ($Passed) { "OK" } else { "PENDENTE" }
        Verificacao = $Name
        Detalhes = $Details
    })
}

$windowsVersion = [Environment]::OSVersion.Version
Add-Check "Windows 10 ou superior" ($windowsVersion.Major -ge 10) ([Environment]::OSVersion.VersionString)

$driveName = [System.IO.Path]::GetPathRoot($CheckoutRoot).TrimEnd("\")
$drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$driveName'"
if ($null -eq $drive) {
    Add-Check "Unidade do checkout" $false "Nao foi possivel consultar $driveName."
} else {
    $freeGb = [math]::Round($drive.FreeSpace / 1GB, 1)
    Add-Check "100 GB livres" ($freeGb -ge 100) "$freeGb GB livres em $driveName."
    Add-Check "Sistema de arquivos NTFS" ($drive.FileSystem -eq "NTFS") "$($drive.FileSystem) em $driveName."
}

$git = Get-Command git -ErrorAction SilentlyContinue
$gitDetails = if ($git) { (& git --version) } else { "Git nao encontrado no PATH." }
Add-Check "Git" ($null -ne $git) $gitDetails

$vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path -LiteralPath $vswhere) {
    $compatibleInstallations = @(& $vswhere -all -products * -version "[18.0,19.0)" -requires Microsoft.VisualStudio.Workload.NativeDesktop -format json | ConvertFrom-Json)
    $hasCompatibleVisualStudio = $compatibleInstallations.Count -gt 0 -and
        -not [string]::IsNullOrWhiteSpace([string]$compatibleInstallations[0].displayName)

    if ($hasCompatibleVisualStudio) {
        $visualStudio = $compatibleInstallations[0]
        $details = "$($visualStudio.displayName) $($visualStudio.installationVersion)"
    } else {
        $installedVersions = @(& $vswhere -all -products * -format json | ConvertFrom-Json)
        $installedDetails = $installedVersions | ForEach-Object { "$($_.displayName) $($_.installationVersion)" }
        $details = if ($installedDetails) {
            "Chromium requer Visual Studio 2026 >= 18.0 com Desktop development with C++. Encontrado: $($installedDetails -join ', ')."
        } else {
            "Chromium requer Visual Studio 2026 >= 18.0 com Desktop development with C++."
        }
    }

    Add-Check "Visual Studio 2026 com C++" $hasCompatibleVisualStudio $details
} else {
    Add-Check "Visual Studio 2026 com C++" $false "vswhere.exe nao encontrado."
}

$depotTools = Get-Command gclient -ErrorAction SilentlyContinue
$depotDetails = if ($depotTools) { $depotTools.Source } else { "gclient nao encontrado no PATH; o script de download pode instala-lo." }
Add-Check "depot_tools" ($null -ne $depotTools) $depotDetails

$results | Format-Table -AutoSize -Wrap

if ($results.Status -contains "PENDENTE") {
    Write-Host "`nO ambiente ainda possui pendencias para compilar o Chromium." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nAmbiente basico pronto para obter e compilar o Chromium." -ForegroundColor Green
