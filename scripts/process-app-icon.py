"""Generate Expo app icon assets from a single source PNG.

Inputs:
  SOURCE (constant below) - path to the original square artwork.

Outputs (overwrites if present):
  mobile/assets/icon.png                       - 1024x1024 full image (iOS + fallback)
  mobile/assets/android-icon-background.png    - 1024x1024 gradient + dash ring, no wordmark
  mobile/assets/android-icon-foreground.png    - 1024x1024 transparent canvas with "RD" centered
  mobile/assets/android-icon-monochrome.png    - 1024x1024 white "RD" mask on transparent
"""
from __future__ import annotations

import colorsys
from pathlib import Path
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / "mobile" / "assets" / "App Icon _ 2000_2000.png"
OUT_DIR = REPO_ROOT / "mobile" / "assets"

CANVAS = 1024
SAFE_ZONE_RATIO = 0.66  # Android adaptive icon safe zone is ~66% of canvas

# HSV thresholds for isolating the bright cyan "RD" wordmark.
# The wordmark is high-saturation, high-value cyan; the ring of dashes
# is dimmer (lower value) and the dark background is low-saturation.
WORDMARK_H_MIN = 0.42   # ~150 deg
WORDMARK_H_MAX = 0.55   # ~200 deg
WORDMARK_S_MIN = 0.55
WORDMARK_V_MIN = 0.70


def load_source() -> Image.Image:
    if not SOURCE.exists():
        raise SystemExit(f"Source image not found: {SOURCE}")
    im = Image.open(SOURCE).convert("RGBA")
    if im.width != im.height:
        raise SystemExit(f"Source must be square, got {im.size}")
    return im


def resize_square(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.LANCZOS)


def build_wordmark_mask(im_rgba: Image.Image) -> Image.Image:
    """Return an L-mode mask where the bright cyan 'RD' pixels are white."""
    px = im_rgba.load()
    w, h = im_rgba.size
    mask = Image.new("L", (w, h), 0)
    mpx = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            if (WORDMARK_H_MIN <= hh <= WORDMARK_H_MAX
                    and ss >= WORDMARK_S_MIN
                    and vv >= WORDMARK_V_MIN):
                mpx[x, y] = 255
    # Restrict to the central region so we don't grab any stray bright pixels
    # from the dash ring. The wordmark sits in roughly the inner 50% diameter.
    cx, cy = w / 2, h / 2
    r_max = w * 0.30  # 30% of canvas radius
    for y in range(h):
        for x in range(w):
            if mpx[x, y] == 0:
                continue
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy > r_max * r_max:
                mpx[x, y] = 0
    return mask


def bounding_box(mask: Image.Image) -> tuple[int, int, int, int]:
    bbox = mask.getbbox()
    if bbox is None:
        raise SystemExit("Failed to detect wordmark — mask is empty. Tune HSV thresholds.")
    return bbox


def make_icon_png(source: Image.Image) -> None:
    out = resize_square(source, CANVAS)
    out.save(OUT_DIR / "icon.png", "PNG")
    print(f"  wrote {OUT_DIR / 'icon.png'}")


def make_foreground(source: Image.Image, mask: Image.Image) -> None:
    """RD wordmark centered on transparent 1024x1024, scaled to safe zone."""
    bbox = bounding_box(mask)
    cropped_rgba = source.crop(bbox)
    cropped_mask = mask.crop(bbox)
    # Apply mask as alpha so only wordmark pixels survive.
    r, g, b, _ = cropped_rgba.split()
    wordmark = Image.merge("RGBA", (r, g, b, cropped_mask))
    # Scale so the longer edge fits within the safe zone.
    target = int(CANVAS * SAFE_ZONE_RATIO)
    scale = target / max(wordmark.size)
    new_size = (max(1, int(wordmark.width * scale)), max(1, int(wordmark.height * scale)))
    wordmark = wordmark.resize(new_size, Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ox = (CANVAS - wordmark.width) // 2
    oy = (CANVAS - wordmark.height) // 2
    canvas.paste(wordmark, (ox, oy), wordmark)
    canvas.save(OUT_DIR / "android-icon-foreground.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-foreground.png'}")


def make_background(source: Image.Image, mask: Image.Image) -> None:
    """Source with the RD wordmark erased and replaced by surrounding color."""
    work = source.copy().convert("RGBA")
    # Dilate the mask slightly so we cover anti-aliased letter edges too.
    dilated = mask.filter(ImageFilter.MaxFilter(7))
    # Build a fill image: heavy blur of the source, sampled outside the mask.
    blurred = source.filter(ImageFilter.GaussianBlur(radius=40)).convert("RGBA")
    # Composite blurred-fill where mask is set, original elsewhere.
    work = Image.composite(blurred, work, dilated)
    out = resize_square(work, CANVAS)
    out.save(OUT_DIR / "android-icon-background.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-background.png'}")


def make_monochrome(mask: Image.Image) -> None:
    """White RD on transparent, same position/scale as foreground."""
    bbox = bounding_box(mask)
    cropped_mask = mask.crop(bbox)
    white = Image.new("RGBA", cropped_mask.size, (255, 255, 255, 0))
    white.putalpha(cropped_mask)
    target = int(CANVAS * SAFE_ZONE_RATIO)
    scale = target / max(white.size)
    new_size = (max(1, int(white.width * scale)), max(1, int(white.height * scale)))
    white = white.resize(new_size, Image.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    ox = (CANVAS - white.width) // 2
    oy = (CANVAS - white.height) // 2
    canvas.paste(white, (ox, oy), white)
    canvas.save(OUT_DIR / "android-icon-monochrome.png", "PNG")
    print(f"  wrote {OUT_DIR / 'android-icon-monochrome.png'}")


def main() -> None:
    print(f"Source: {SOURCE}")
    source = load_source()
    print(f"  size: {source.size}")
    mask = build_wordmark_mask(source)
    make_icon_png(source)
    make_background(source, mask)
    make_foreground(source, mask)
    make_monochrome(mask)
    print("Done.")


if __name__ == "__main__":
    main()
