"""Regenerates assets/images/{icon,favicon,splash-icon,android-icon-*}.png
— the suitcase + paper-plane mark in the Atlas Blue palette. Pure PIL
(no SVG renderer needed). Run with: python3 scripts/generate-app-icon.py
To tweak the design, adjust draw_suitcase_and_plane() and rerun; tune the
per-output `scale` so content stays inside Android's circular safe zone
(see the adaptive-icon calls below) and doesn't crowd the canvas edges
on icon.png.
"""

import math
import os

from PIL import Image, ImageDraw

NAVY = (28, 43, 69, 255)       # #1C2B45 brand.ink
CREAM = (246, 243, 236, 255)   # #F6F3EC brand.paper
BRASS = (184, 137, 59, 255)    # #B8893B brand.accent
BRASS_DARK = (150, 108, 42, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

CANVAS = 1024


def draw_suitcase_and_plane(draw, cx, cy, scale, mark_color, strap_color, mono=False):
    """Draw the suitcase+plane mark centered at (cx, cy). scale=1 -> suitcase ~560px wide."""
    s = scale

    # --- Suitcase body ---
    body_w, body_h = 560 * s, 400 * s
    body_left = cx - body_w / 2
    body_top = cy - body_h / 2 + 40 * s
    body_right = cx + body_w / 2
    body_bottom = body_top + body_h
    radius = 48 * s
    draw.rounded_rectangle(
        [body_left, body_top, body_right, body_bottom], radius=radius, fill=mark_color
    )

    # --- Handle (stadium arc on top) ---
    handle_w = 220 * s
    handle_h = 150 * s
    handle_cx = cx
    handle_bottom = body_top + 30 * s
    handle_top = handle_bottom - handle_h
    stroke = 36 * s
    draw.rounded_rectangle(
        [handle_cx - handle_w / 2, handle_top, handle_cx + handle_w / 2, handle_bottom],
        radius=handle_w / 2,
        outline=mark_color,
        width=int(stroke),
    )

    # --- Horizontal belt strap across the middle ---
    strap_h = 70 * s
    strap_top = cy - strap_h / 2 + 20 * s
    strap_bottom = strap_top + strap_h
    draw.rectangle([body_left, strap_top, body_right, strap_bottom], fill=strap_color)

    # buckle in the center of the strap
    buckle_w, buckle_h = 90 * s, strap_h + 28 * s
    draw.rounded_rectangle(
        [
            cx - buckle_w / 2,
            strap_top - 14 * s,
            cx + buckle_w / 2,
            strap_top - 14 * s + buckle_h,
        ],
        radius=14 * s,
        outline=strap_color,
        width=int(10 * s),
        fill=mark_color if not mono else None,
    )

    # --- Two latches near the top of the body ---
    latch_w, latch_h = 54 * s, 40 * s
    latch_y = body_top + 46 * s
    for dx in (-150 * s, 150 * s):
        draw.rounded_rectangle(
            [cx + dx - latch_w / 2, latch_y, cx + dx + latch_w / 2, latch_y + latch_h],
            radius=10 * s,
            fill=strap_color,
        )

    # --- Small paper-plane, departing up and to the right ---
    plane_cx = cx + 275 * s
    plane_cy = cy - 250 * s
    plane_scale = 150 * s
    angle = math.radians(-38)

    def rot(px, py):
        dx, dy = px * plane_scale, py * plane_scale
        rx = dx * math.cos(angle) - dy * math.sin(angle)
        ry = dx * math.sin(angle) + dy * math.cos(angle)
        return (plane_cx + rx, plane_cy + ry)

    # simple dart/paper-plane silhouette (nose, two wing tips, tail notch)
    plane_pts = [
        rot(0.9, 0),
        rot(-0.75, 0.42),
        rot(-0.42, 0.08),
        rot(-0.75, -0.42),
    ]
    draw.polygon(plane_pts, fill=strap_color)
    # centerfold accent line
    draw.line([rot(0.9, 0), rot(-0.55, 0)], fill=mark_color, width=max(1, int(8 * s)))

    # dashed flight trail behind the plane, curving toward the suitcase handle
    trail_start = rot(-0.6, 0.05)
    trail_end = (handle_cx - 10 * s, handle_top + 10 * s)
    n_dashes = 5
    for i in range(1, n_dashes + 1):
        t = i / (n_dashes + 1.4)
        # slight curve via quadratic bezier-ish interpolation
        mx = (trail_start[0] + trail_end[0]) / 2 + 60 * s
        my = (trail_start[1] + trail_end[1]) / 2
        x = (1 - t) ** 2 * trail_start[0] + 2 * (1 - t) * t * mx + t**2 * trail_end[0]
        y = (1 - t) ** 2 * trail_start[1] + 2 * (1 - t) * t * my + t**2 * trail_end[1]
        r = 9 * s
        draw.ellipse([x - r, y - r, x + r, y + r], fill=strap_color)


def new_canvas(bg):
    return Image.new("RGBA", (CANVAS, CANVAS), bg)


def save(img, path):
    img.save(path)
    print("wrote", path, img.size)


out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "images")

# 1) icon.png — full bleed navy background + cream suitcase / brass accents
img = new_canvas(NAVY)
d = ImageDraw.Draw(img)
draw_suitcase_and_plane(d, CANVAS / 2 - 40, CANVAS / 2 + 30, 1.1, CREAM, BRASS)
save(img, f"{out}/icon.png")

# 2) favicon.png — small version, same composition
favicon = img.resize((196, 196), Image.LANCZOS)
save(favicon, f"{out}/favicon.png")

# 3) android-icon-background.png — flat navy
bg_img = new_canvas(NAVY)
save(bg_img, f"{out}/android-icon-background.png")

# 4) android-icon-foreground.png — transparent, mark scaled into the adaptive-icon safe zone (~66%)
fg_img = new_canvas(TRANSPARENT)
d = ImageDraw.Draw(fg_img)
draw_suitcase_and_plane(d, CANVAS / 2, CANVAS / 2 + 10, 0.52, CREAM, BRASS)
save(fg_img, f"{out}/android-icon-foreground.png")

# 5) android-icon-monochrome.png — transparent, single-color (white) silhouette, same safe zone
mono_img = new_canvas(TRANSPARENT)
d = ImageDraw.Draw(mono_img)
draw_suitcase_and_plane(d, CANVAS / 2, CANVAS / 2 + 10, 0.52, WHITE, WHITE, mono=True)
save(mono_img, f"{out}/android-icon-monochrome.png")

# 6) splash-icon.png — transparent, generously sized mark for the splash screen (contain mode)
splash_img = new_canvas(TRANSPARENT)
d = ImageDraw.Draw(splash_img)
draw_suitcase_and_plane(d, CANVAS / 2, CANVAS / 2 + 10, 0.85, CREAM, BRASS)
save(splash_img, f"{out}/splash-icon.png")

print("done")
