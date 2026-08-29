param(
    [string]$ChromiumSource = 'C:\src\atlas-chromium\src'
)

$ErrorActionPreference = 'Stop'

$atlasRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$atlasBranding = Join-Path $atlasRoot 'chromium\branding\atlas'
$atlasGenerated = Join-Path $atlasBranding 'generated'
$chromiumTheme = Join-Path $ChromiumSource 'chrome\app\theme\chromium'

if (-not (Test-Path -LiteralPath $chromiumTheme -PathType Container)) {
    throw "Chromium theme directory not found: $chromiumTheme"
}

$copies = @{
    (Join-Path $atlasBranding 'mark.svg') = @(
        (Join-Path $chromiumTheme 'product_logo.svg'),
        (Join-Path $chromiumTheme 'product_logo_animation.svg')
    )
    (Join-Path $atlasGenerated 'product-logo-16.png') = @((Join-Path $chromiumTheme 'product_logo_16.png'))
    (Join-Path $atlasGenerated 'product-logo-24.png') = @((Join-Path $chromiumTheme 'product_logo_24.png'))
    (Join-Path $atlasGenerated 'product-logo-48.png') = @((Join-Path $chromiumTheme 'product_logo_48.png'))
    (Join-Path $atlasGenerated 'product-logo-64.png') = @((Join-Path $chromiumTheme 'product_logo_64.png'))
    (Join-Path $atlasGenerated 'product-logo-128.png') = @((Join-Path $chromiumTheme 'product_logo_128.png'))
    (Join-Path $atlasGenerated 'product-logo-256.png') = @((Join-Path $chromiumTheme 'product_logo_256.png'))
    (Join-Path $atlasGenerated 'product-logo-22-mono.png') = @((Join-Path $chromiumTheme 'product_logo_22_mono.png'))
    (Join-Path $atlasGenerated 'atlas.ico') = @(
        (Join-Path $chromiumTheme 'win\chromium.ico'),
        (Join-Path $chromiumTheme 'win\app_list.ico')
    )
    (Join-Path $atlasGenerated 'app-icon-dark-600.png') = @((Join-Path $chromiumTheme 'win\tiles\Logo.png'))
    (Join-Path $atlasGenerated 'app-icon-dark-176.png') = @((Join-Path $chromiumTheme 'win\tiles\SmallLogo.png'))
}

foreach ($source in $copies.Keys) {
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Generated branding asset not found: $source"
    }

    foreach ($destination in $copies[$source]) {
        Copy-Item -LiteralPath $source -Destination $destination -Force
    }
}

Write-Output 'Atlas branding assets applied to the Chromium checkout.'
