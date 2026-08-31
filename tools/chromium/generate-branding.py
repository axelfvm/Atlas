from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "chromium" / "branding" / "atlas"
GENERATED = SOURCE / "generated"
PRODUCT_SIZES = (16, 20, 22, 24, 32, 40, 44, 48, 64, 128, 176, 256, 600)
ICON_SIZES = (16, 20, 24, 32, 40, 48, 64, 128, 256)
APP_RASTER_SIZES = ICON_SIZES + (176, 600)


def render(source_name: str, output_stem: str, sizes: tuple[int, ...]) -> None:
    source = SOURCE / source_name
    for size in sizes:
        cairosvg.svg2png(
            url=str(source),
            write_to=str(GENERATED / f"{output_stem}-{size}.png"),
            output_width=size,
            output_height=size,
        )


def build_app_icons() -> None:
    backgrounds = {
        "app-icon-dark": "#060B24",
        "app-icon-light": "#F7F8FC",
    }
    for output_stem, color in backgrounds.items():
        for size in APP_RASTER_SIZES:
            inset = max(1, round(size * 32 / 1024))
            radius = max(1, round(size * 224 / 1024))
            rounded = Image.new("L", (size, size), 0)
            ImageDraw.Draw(rounded).rounded_rectangle(
                (inset, inset, size - inset - 1, size - inset - 1),
                radius=radius,
                fill=255,
            )
            background = Image.new("RGBA", (size, size), color)
            canvas = Image.composite(background, Image.new("RGBA", (size, size)), rounded)
            mark = Image.open(GENERATED / f"product-logo-{size}.png").convert("RGBA")
            canvas.alpha_composite(mark)
            canvas.save(GENERATED / f"{output_stem}-{size}.png")


def build_ico() -> None:
    source = Image.open(GENERATED / "app-icon-dark-256.png").convert("RGBA")
    source.save(
        GENERATED / "atlas.ico",
        format="ICO",
        sizes=[(size, size) for size in ICON_SIZES],
        bitmap_format="bmp",
    )


def build_mono() -> None:
    svg = (SOURCE / "mark.svg").read_text(encoding="utf-8")
    mono_svg = svg.replace('fill="url(#atlasMark)"', 'fill="#060B24"')
    cairosvg.svg2png(
        bytestring=mono_svg.encode("utf-8"),
        write_to=str(GENERATED / "product-logo-22-mono.png"),
        output_width=22,
        output_height=22,
    )


def build_wordmarks() -> None:
    font_path = Path(r"C:\Windows\Fonts\segoeui.ttf")
    if not font_path.is_file():
        raise FileNotFoundError(f"Windows UI font not found: {font_path}")

    for scale in (1, 2):
        width, height = 97 * scale, 22 * scale
        mark_size = 22 * scale
        mark = Image.open(GENERATED / f"product-logo-{mark_size}.png").convert("RGBA")
        font = ImageFont.truetype(str(font_path), 16 * scale)

        for suffix, text_color in (("", "#060B24"), ("-white", "#FFFFFF")):
            canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            canvas.alpha_composite(mark)
            draw = ImageDraw.Draw(canvas)
            text_box = draw.textbbox((0, 0), "Atlas", font=font)
            text_height = text_box[3] - text_box[1]
            text_y = (height - text_height) // 2 - text_box[1]
            draw.text((27 * scale, text_y), "Atlas", font=font, fill=text_color)
            canvas.save(GENERATED / f"product-logo-name-22{suffix}-{scale}x.png")


def main() -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    render("mark.svg", "product-logo", tuple(sorted(set(PRODUCT_SIZES + APP_RASTER_SIZES))))
    build_app_icons()
    build_mono()
    build_wordmarks()
    build_ico()


if __name__ == "__main__":
    main()
