[CmdletBinding()]
param(
    [string]$CheckoutRoot = "C:\src\atlas-chromium",
    [string]$DepotToolsPath = "C:\src\depot_tools",
    [string]$Configuration = "Atlas",
    [string]$Target = "chrome",
    [int]$Jobs = 0
)

$ErrorActionPreference = "Stop"
$sourceRoot = Join-Path $CheckoutRoot "src"
$outputRoot = Join-Path $sourceRoot "out\$Configuration"
$argsFile = Join-Path $outputRoot "args.gn"

if (-not (Test-Path -LiteralPath $sourceRoot)) {
    throw "Checkout do Chromium nao encontrado em $sourceRoot."
}

if (-not (Test-Path -LiteralPath $DepotToolsPath)) {
    throw "depot_tools nao encontrado em $DepotToolsPath."
}

if (-not (Test-Path -LiteralPath $argsFile)) {
    throw "Configuracao nao encontrada em $argsFile. Execute gn gen antes do primeiro build."
}

$env:PATH = "$DepotToolsPath;$env:PATH"
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = "0"

if (-not [string]::IsNullOrWhiteSpace($env:vs2026_install)) {
    $env:GYP_MSVS_OVERRIDE_PATH = $env:vs2026_install
}

$buildArguments = @("-C", "out\$Configuration")
if ($Jobs -gt 0) {
    $buildArguments += @("-j", $Jobs)
}
$buildArguments += $Target

Write-Host "Build incremental: $Target ($Configuration)" -ForegroundColor Cyan
Write-Host "Os objetos existentes em $outputRoot serao reutilizados." -ForegroundColor DarkGray

Push-Location $sourceRoot
try {
    & autoninja @buildArguments
    if ($LASTEXITCODE -ne 0) {
        throw "autoninja terminou com o codigo $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

Write-Host "Build concluido com sucesso." -ForegroundColor Green
