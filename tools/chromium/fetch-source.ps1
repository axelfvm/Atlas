[CmdletBinding()]
param(
    [string]$CheckoutRoot = "C:\src\atlas-chromium",
    [string]$DepotToolsRoot = "C:\src\depot_tools",
    [switch]$NoHistory
)

$ErrorActionPreference = "Stop"

foreach ($path in @($CheckoutRoot, $DepotToolsRoot)) {
    if ($path.Contains(" ")) {
        throw "O caminho nao pode conter espacos: $path"
    }
}

$checkoutFullPath = [System.IO.Path]::GetFullPath($CheckoutRoot)
$depotToolsFullPath = [System.IO.Path]::GetFullPath($DepotToolsRoot)

if (-not (Test-Path -LiteralPath $depotToolsFullPath)) {
    $depotParent = Split-Path -Parent $depotToolsFullPath
    New-Item -ItemType Directory -Force -Path $depotParent | Out-Null
    & git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git $depotToolsFullPath
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao obter depot_tools."
    }
}

$env:Path = "$depotToolsFullPath;$env:Path"
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = "0"

New-Item -ItemType Directory -Force -Path $checkoutFullPath | Out-Null
if (Get-ChildItem -Force -LiteralPath $checkoutFullPath | Select-Object -First 1) {
    throw "O checkout precisa estar vazio: $checkoutFullPath"
}

$fetchArguments = if ($NoHistory) { "--no-history chromium" } else { "--git-cache chromium" }
Push-Location $checkoutFullPath
try {
    & cmd.exe /d /c "fetch $fetchArguments"
    if ($LASTEXITCODE -ne 0) {
        throw "O download do Chromium terminou com erro."
    }
} finally {
    Pop-Location
}

Write-Host "Chromium obtido em $checkoutFullPath\src" -ForegroundColor Green
Write-Host "Copie chromium\args\windows-debug.gn para src\out\Atlas\args.gn e execute gn gen out\Atlas."
