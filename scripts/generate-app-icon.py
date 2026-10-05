"""Regenerates assets/images/{icon,favicon,splash-icon,android-icon-*}.png
— a circular badge with a merged plane + suitcase mark on a deep navy
vertical gradient. Pure PIL (no SVG renderer needed). Run with:
    python3 scripts/generate-app-icon.py
To tweak the design, adjust draw_badge() / gradient() and rerun; keep mark
content inside the ring for Android's circular adaptive-icon safe zone
(see the `scale` passed to each output call below).
"""

import math
import os

from PIL import Image, ImageDraw

NAVY_TOP = (28, 43, 69, 255)  # #1C2B45 brand.ink
NAVY_BOTTOM = (6, 9, 17, 255)  # near-black navy
CREAM = (246, 243, 236, 255)  # #F6F3EC brand.paper
BRASS = (184, 137, 59, 255)  # #B8893B brand.accent
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

CANVAS = 1024


def poly(cx, cy, scale, angle_deg, pts):
    """Rotate+scale+translate a list of (x,y) unit points around (cx,cy)."""
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


def draw_plane(draw, cx, cy, scale, color):
    """Single-silhouette calm commercial airliner (long nose, gentle swept
    main wings, smaller tail wings, shallow tail notch) — not a fighter jet."""
    pts = [
        (0, -1.00),  # nose tip
        (0.04, -0.60),  # right of nose
        (0.90, 0.00),  # right main wingtip (barely swept — commercial, not delta)
        (0.62, 0.15),  # right main wing trailing edge
        (0.08, -0.05),  # back to fuselage
        (0.08, 0.35),  # fuselage right, down to the tail section
        (0.26, 0.48),  # right tail wingtip (small)
        (0.16, 0.52),  # right tail wing trailing edge
        (0.05, 0.42),  # back to fuselage near tail
        (0.05, 0.58),  # fuselage end, right
        (0, 0.50),  # shallow tail notch (gentle, not a deep fork)
        (-0.05, 0.58),  # fuselage end, left
        (-0.05, 0.42),
        (-0.16, 0.52),  # left tail wing trailing edge
        (-0.26, 0.48),  # left tail wingtip
        (-0.08, 0.35),
        (-0.08, -0.05),
        (-0.62, 0.15),  # left main wing trailing edge
        (-0.90, 0.00),  # left main wingtip
        (-0.04, -0.60),
    ]
    draw.polygon(poly(cx, cy, scale, 0, pts), fill=color)
    return poly(cx, cy, scale, 0, pts)


def draw_badge(draw, cx, cy, scale, ring_color, mark_color, accent_color, ring=True):
    """scale=1 -> ring radius ~460px (fits a 1024 canvas with margin)."""
    s = scale

    if ring:
        r = 460 * s
        w = 26 * s
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ring_color, width=int(w))

    plane_scale = 300 * s
    plane_cx, plane_cy = cx - 10 * s, cy - 95 * s
    plane_pts = draw_plane(draw, plane_cx, plane_cy, plane_scale, mark_color)

    # --- Suitcase, overlapping the plane's tail slightly, lower-right ---
    case_scale = 150 * s
    case_cx, case_cy = cx + 90 * s, cy + 195 * s
    body_w, body_h = 1.5 * case_scale, 1.05 * case_scale
    radius = 0.22 * case_scale
    draw.rounded_rectangle(
        [case_cx - body_w / 2, case_cy - body_h / 2, case_cx + body_w / 2, case_cy + body_h / 2],
        radius=radius,
        fill=mark_color,
    )
    # handle: a clean open stadium ring sitting on top
    handle_w, handle_h = 0.62 * case_scale, 0.5 * case_scale
    handle_bottom = case_cy - body_h / 2 + 10 * s
    draw.rounded_rectangle(
        [
            case_cx - handle_w / 2,
            handle_bottom - handle_h,
            case_cx + handle_w / 2,
            handle_bottom,
        ],
        radius=handle_w / 2,
        outline=mark_color,
        width=max(1, int(0.11 * case_scale)),
    )
    # strap accent
    strap_h = 0.22 * case_scale
    draw.rectangle(
        [
            case_cx - body_w / 2,
            case_cy - strap_h / 2,
            case_cx + body_w / 2,
            case_cy + strap_h / 2,
        ],
        fill=accent_color,
    )

    # --- Motion lines: three clean parallel strokes trailing the left wingtip ---
    wing_tip = plane_pts[18]  # left main wingtip, already in canvas coords
    direction = (-0.82, 0.42)  # down-left
    perp = (-direction[1], direction[0])
    for i, (length, width, col) in enumerate(
        [
            (175 * s, 28 * s, accent_color),
            (130 * s, 20 * s, mark_color),
            (85 * s, 13 * s, accent_color),
        ]
    ):
        offset = (28 * s) * (i + 1)
        start = (wing_tip[0] + perp[0] * offset * 0.3, wing_tip[1] + perp[1] * offset * 0.3 + 10 * s)
        start = (start[0] - 10 * s * i, start[1] + 46 * s * i)
        end = (start[0] + direction[0] * length, start[1] + direction[1] * length)
        draw.line([start, end], fill=col, width=int(width))


def save(img, path):
    img.convert("RGBA").save(path)
    print("wrote", path, img.size)


out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "images")

# 1) icon.png — deep navy vertical gradient background + cream mark, brass accents
img = vertical_gradient(CANVAS, NAVY_TOP, NAVY_BOTTOM)
d = ImageDraw.Draw(img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 1.0, CREAM, CREAM, BRASS)
save(img, f"{out}/icon.png")

# 2) favicon.png
favicon = img.resize((196, 196), Image.LANCZOS)
save(favicon, f"{out}/favicon.png")

# 3) android-icon-background.png — same gradient, no mark
bg_img = vertical_gradient(CANVAS, NAVY_TOP, NAVY_BOTTOM)
save(bg_img, f"{out}/android-icon-background.png")

# 4) android-icon-foreground.png — transparent, scaled into the circular safe zone, no ring
#    (the ring would double up visually with the adaptive-icon's own circular crop)
fg_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(fg_img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.62, CREAM, CREAM, BRASS, ring=False)
save(fg_img, f"{out}/android-icon-foreground.png")

# 5) android-icon-monochrome.png — transparent, single-color white silhouette
mono_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(mono_img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.62, WHITE, WHITE, WHITE, ring=False)
save(mono_img, f"{out}/android-icon-monochrome.png")

# 6) splash-icon.png — transparent, mark + ring, generously sized for "contain" mode
splash_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(splash_img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.95, CREAM, CREAM, BRASS)
save(splash_img, f"{out}/splash-icon.png")

print("done")
