param(
    [string]$ChromiumSource = 'C:\src\atlas-chromium\src'
)

$ErrorActionPreference = 'Stop'

$atlasRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$atlasBranding = Join-Path $atlasRoot 'chromium\branding\atlas'
$atlasGenerated = Join-Path $atlasBranding 'generated'
$chromiumTheme = Join-Path $ChromiumSource 'chrome\app\theme\chromium'
$chromiumTheme100 = Join-Path $ChromiumSource 'chrome\app\theme\default_100_percent\chromium'
$chromiumTheme200 = Join-Path $ChromiumSource 'chrome\app\theme\default_200_percent\chromium'
$chromiumVectorIcons = Join-Path $ChromiumSource 'chrome\app\vector_icons'
$chromiumWebUiImages = Join-Path $ChromiumSource 'ui\webui\resources\images'
$chromiumMiniInstaller = Join-Path $ChromiumSource 'chrome\installer\mini_installer'
$chromiumSetup = Join-Path $ChromiumSource 'chrome\installer\setup'

if (-not (Test-Path -LiteralPath $chromiumTheme -PathType Container)) {
    throw "Chromium theme directory not found: $chromiumTheme"
}

$copies = @{
    (Join-Path $atlasBranding 'mark.svg') = @(
        (Join-Path $chromiumTheme 'product_logo.svg'),
        (Join-Path $chromiumTheme 'product_logo_animation.svg'),
        (Join-Path $chromiumWebUiImages 'chrome_logo_dark.svg')
    )
    (Join-Path $atlasBranding 'chrome_product.icon') = @(
        (Join-Path $chromiumVectorIcons 'chrome_product.icon'),
        (Join-Path $chromiumVectorIcons 'browser_logo_old.icon')
    )
    (Join-Path $atlasGenerated 'product-logo-16.png') = @(
        (Join-Path $chromiumTheme 'product_logo_16.png'),
        (Join-Path $chromiumTheme100 'product_logo_16.png'),
        (Join-Path $chromiumTheme100 'favicon_password_manager.png')
    )
    (Join-Path $atlasGenerated 'product-logo-24.png') = @((Join-Path $chromiumTheme 'product_logo_24.png'))
    (Join-Path $atlasGenerated 'product-logo-48.png') = @((Join-Path $chromiumTheme 'product_logo_48.png'))
    (Join-Path $atlasGenerated 'product-logo-64.png') = @(
        (Join-Path $chromiumTheme 'product_logo_64.png'),
        (Join-Path $chromiumTheme200 'product_logo_32.png')
    )
    (Join-Path $atlasGenerated 'product-logo-128.png') = @((Join-Path $chromiumTheme 'product_logo_128.png'))
    (Join-Path $atlasGenerated 'product-logo-256.png') = @((Join-Path $chromiumTheme 'product_logo_256.png'))
    (Join-Path $atlasGenerated 'product-logo-22-mono.png') = @((Join-Path $chromiumTheme 'product_logo_22_mono.png'))
    (Join-Path $atlasGenerated 'atlas.ico') = @(
        (Join-Path $chromiumTheme 'win\chromium.ico'),
        (Join-Path $chromiumTheme 'win\app_list.ico'),
        (Join-Path $chromiumTheme 'win\incognito.ico'),
        (Join-Path $chromiumTheme 'win\chromium_doc.ico'),
        (Join-Path $chromiumTheme 'win\chromium_pdf.ico'),
        (Join-Path $chromiumTheme 'win\isolated.ico'),
        (Join-Path $chromiumMiniInstaller 'mini_installer.ico'),
        (Join-Path $chromiumSetup 'setup.ico')
    )
    (Join-Path $atlasGenerated 'app-icon-dark-600.png') = @((Join-Path $chromiumTheme 'win\tiles\Logo.png'))
    (Join-Path $atlasGenerated 'app-icon-dark-176.png') = @((Join-Path $chromiumTheme 'win\tiles\SmallLogo.png'))
    (Join-Path $atlasGenerated 'product-logo-32.png') = @(
        (Join-Path $chromiumTheme100 'product_logo_32.png'),
        (Join-Path $chromiumTheme200 'product_logo_16.png'),
        (Join-Path $chromiumTheme200 'favicon_password_manager.png')
    )
    (Join-Path $atlasGenerated 'product-logo-name-22-1x.png') = @((Join-Path $chromiumTheme100 'product_logo_name_22.png'))
    (Join-Path $atlasGenerated 'product-logo-name-22-white-1x.png') = @((Join-Path $chromiumTheme100 'product_logo_name_22_white.png'))
    (Join-Path $atlasGenerated 'product-logo-name-22-2x.png') = @((Join-Path $chromiumTheme200 'product_logo_name_22.png'))
    (Join-Path $atlasGenerated 'product-logo-name-22-white-2x.png') = @((Join-Path $chromiumTheme200 'product_logo_name_22_white.png'))
}

foreach ($source in $copies.Keys) {
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Generated branding asset not found: $source"
    }

    foreach ($destination in $copies[$source]) {
        Copy-Item -LiteralPath $source -Destination $destination -Force
    }
}

$productNameScript = Join-Path $PSScriptRoot 'apply-product-name.py'
if (-not (Test-Path -LiteralPath $productNameScript -PathType Leaf)) {
    throw "Atlas product-name script not found: $productNameScript"
}

& python $productNameScript $ChromiumSource
if ($LASTEXITCODE -ne 0) {
    throw "Failed to apply the Atlas product name to Chromium resources."
}

$versionScript = Join-Path $PSScriptRoot 'apply-version.py'
$versionManifest = Join-Path $atlasRoot 'atlas-version.json'
& python $versionScript $ChromiumSource $versionManifest
if ($LASTEXITCODE -ne 0) {
    throw "Failed to apply Atlas product-version metadata."
}

Write-Output 'Atlas branding assets and user-visible product name applied to the Chromium checkout.'
