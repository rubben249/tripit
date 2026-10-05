"""SUPERSEDED (2026-10-05) by scripts/generate-logo-t.py — kept for history.
One-off: extract the white mark (ring+plane+suitcase) from the user's own
reference screenshot as a clean alpha-masked silhouette, recolor it to our
(then-current) Atlas Blue palette, and regenerate all icon outputs from it —
preserving their exact composition instead of a hand-drawn approximation.
Run with: python3 scripts/extract_user_logo.py
"""

import os

from PIL import Image

NAVY_TOP = (28, 43, 69, 255)
NAVY_BOTTOM = (6, 9, 17, 255)
CREAM = (246, 243, 236, 255)
WHITE = (255, 255, 255, 255)

CANVAS = 1024
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source", "user-logo-reference.png")
BG_LUMA = 20  # approx luminance of the navy background in the source
MARK_LUMA = 250  # approx luminance of the white mark

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "images")
public_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")


def vertical_gradient(size, top, bottom):
    img = Image.new("RGBA", (1, size), (0, 0, 0, 0))
    for y in range(size):
        t = y / (size - 1)
        px = tuple(int(top[c] + (bottom[c] - top[c]) * t) for c in range(4))
        img.putpixel((0, y), px)
    return img.resize((size, size))


def luminance(r, g, b):
    return 0.299 * r + 0.587 * g + 0.114 * b


def extract_mask(src_path):
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    px = img.load()
    mask = Image.new("L", (w, h), 0)
    mpx = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = luminance(r, g, b)
            alpha = (lum - BG_LUMA) / (MARK_LUMA - BG_LUMA)
            alpha = max(0.0, min(1.0, alpha))
            mpx[x, y] = int(alpha * 255)
    # The source screenshot has a faint rounded-corner/shadow artifact right
    # at its edges (lighter than the navy background, picked up as alpha
    # bleed) — the real artwork never reaches the absolute edge, so it's
    # safe to clear a thin border.
    border = max(2, int(min(w, h) * 0.02))
    for y in range(h):
        for x in range(border):
            mpx[x, y] = 0
            mpx[w - 1 - x, y] = 0
    for x in range(w):
        for y in range(border):
            mpx[x, y] = 0
            mpx[x, h - 1 - y] = 0
    return mask


def tight_square_crop(mask):
    bbox = mask.getbbox()
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    size = max(w, h)
    pad = int(size * 0.06)
    size += pad * 2
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left, top = int(cx - size / 2), int(cy - size / 2)
    canvas = Image.new("L", (size, size), 0)
    canvas.paste(mask, (-left, -top))
    return canvas


def colorize(mask_square, color):
    rgba = Image.new("RGBA", mask_square.size, (0, 0, 0, 0))
    solid = Image.new("RGBA", mask_square.size, color)
    rgba.paste(solid, (0, 0), mask_square)
    return rgba


def shrink_to_safe_zone(rgba, scale=0.62):
    """The source art fills ~edge-to-edge (ring nearly touches the square's
    border). Android's adaptive-icon mask crops to a circle well inside that
    square, so the foreground/monochrome layers need real margin or the ring
    gets clipped — shrink and center on a transparent canvas."""
    size = rgba.size[0]
    small = rgba.resize((int(size * scale), int(size * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off = (size - small.size[0]) // 2
    canvas.paste(small, (off, off), small)
    return canvas


def save(img, path):
    img.convert("RGBA").save(path)
    print("wrote", path, img.size)


def main():
    raw_mask = extract_mask(SRC)
    square_mask = tight_square_crop(raw_mask).resize((CANVAS, CANVAS), Image.LANCZOS)

    mark_cream = colorize(square_mask, CREAM)
    save(mark_cream, f"{out}/splash-icon.png")

    mark_white = colorize(square_mask, WHITE)
    save(shrink_to_safe_zone(mark_white), f"{out}/android-icon-monochrome.png")
    save(shrink_to_safe_zone(mark_cream), f"{out}/android-icon-foreground.png")

    bg = vertical_gradient(CANVAS, NAVY_TOP, NAVY_BOTTOM)
    icon = Image.alpha_composite(bg, mark_cream)
    save(icon, f"{out}/icon.png")

    favicon = icon.resize((196, 196), Image.LANCZOS)
    save(favicon, f"{out}/favicon.png")

    bg_only = vertical_gradient(CANVAS, NAVY_TOP, NAVY_BOTTOM)
    save(bg_only, f"{out}/android-icon-background.png")

    apple_touch = icon.convert("RGB").resize((180, 180), Image.LANCZOS)
    apple_touch.save(f"{public_dir}/apple-touch-icon.png")
    print("wrote apple-touch-icon.png")


if __name__ == "__main__":
    main()
