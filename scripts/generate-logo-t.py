"""Regenerates assets/images/{icon,favicon,splash-icon,android-icon-*}.png
and public/apple-touch-icon.png — a circular badge on the Atlas Umber brown
gradient, with the plane mark kept from the previous logo and a bold
Fraunces "T" (for TripIt) as the dominant new element, replacing the
suitcase (decision 2026-10-05: "ahora hay una T, deja el avión").
Run with: python3 scripts/generate-logo-t.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFont

INK_TOP = (43, 30, 18, 255)  # #2B1E12 brand.ink
INK_BOTTOM = (15, 10, 6, 255)  # near-black espresso
CREAM = (247, 241, 230, 255)  # #F7F1E6 brand.paper
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

CANVAS = 1024
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(ROOT, "assets", "fonts", "Fraunces-SemiBold.ttf")
OUT = os.path.join(ROOT, "assets", "images")
PUBLIC = os.path.join(ROOT, "public")


def poly(cx, cy, scale, angle_deg, pts):
    a = math.radians(angle_deg)
    out = []
    for x, y in pts:
        dx, dy = x * scale, y * scale
        rx = dx * math.cos(a) - dy * math.sin(a)
        ry = dx * math.sin(a) + dy * math.cos(a)
        out.append((cx + rx, cy + ry))
    return out


def vertical_gradient(size, top, bottom):
    img = Image.new("RGBA", (1, size), TRANSPARENT)
    for y in range(size):
        t = y / (size - 1)
        px = tuple(int(top[c] + (bottom[c] - top[c]) * t) for c in range(4))
        img.putpixel((0, y), px)
    return img.resize((size, size))


def draw_plane(draw, cx, cy, scale, color, angle_deg=-10):
    """Classic dart/delta silhouette, banked slightly nose-up for a sense of
    departure/climb — a calm commercial-jet shape, not a fighter jet."""
    pts = [
        (0, -1.00),
        (0.08, -0.42),
        (0.95, 0.32),
        (0.62, 0.40),
        (0, 0.08),
        (-0.62, 0.40),
        (-0.95, 0.32),
        (-0.08, -0.42),
    ]
    draw.polygon(poly(cx, cy, scale, angle_deg, pts), fill=color)


def draw_T(draw, cx, cy, size, color):
    font = ImageFont.truetype(FONT_PATH, size)
    bbox = font.getbbox("T")
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - w / 2 - bbox[0], cy - h / 2 - bbox[1]), "T", font=font, fill=color)


def draw_mark(draw, cx, cy, scale, ring_color, mark_color, ring=True):
    s = scale
    if ring:
        r = 460 * s
        w = 26 * s
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ring_color, width=int(w))

    draw_plane(draw, cx + 30 * s, cy - 230 * s, 170 * s, mark_color)
    draw_T(draw, cx, cy + 110 * s, int(580 * s), mark_color)


def save(img, path):
    img.convert("RGBA").save(path)
    print("wrote", path, img.size)


# 1) icon.png — brown vertical gradient background + cream mark
img = vertical_gradient(CANVAS, INK_TOP, INK_BOTTOM)
d = ImageDraw.Draw(img)
draw_mark(d, CANVAS / 2, CANVAS / 2, 1.0, CREAM, CREAM)
save(img, f"{OUT}/icon.png")

# 2) favicon.png
favicon = img.resize((196, 196), Image.LANCZOS)
save(favicon, f"{OUT}/favicon.png")

# 3) android-icon-background.png — same gradient, no mark
bg_img = vertical_gradient(CANVAS, INK_TOP, INK_BOTTOM)
save(bg_img, f"{OUT}/android-icon-background.png")

# 4) android-icon-foreground.png — transparent, scaled into the circular safe zone, no ring
fg_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(fg_img)
draw_mark(d, CANVAS / 2, CANVAS / 2, 0.62, CREAM, CREAM, ring=False)
save(fg_img, f"{OUT}/android-icon-foreground.png")

# 5) android-icon-monochrome.png — transparent, single-color white silhouette
mono_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(mono_img)
draw_mark(d, CANVAS / 2, CANVAS / 2, 0.62, WHITE, WHITE, ring=False)
save(mono_img, f"{OUT}/android-icon-monochrome.png")

# 6) splash-icon.png — transparent, mark + ring
splash_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(splash_img)
draw_mark(d, CANVAS / 2, CANVAS / 2, 0.95, CREAM, CREAM)
save(splash_img, f"{OUT}/splash-icon.png")

# 7) apple-touch-icon.png — opaque (iOS ignores alpha and shows black)
apple_touch = img.convert("RGB").resize((180, 180), Image.LANCZOS)
apple_touch.save(f"{PUBLIC}/apple-touch-icon.png")
print("wrote apple-touch-icon.png")

print("done")
