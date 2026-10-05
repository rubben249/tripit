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
    """Clean dart/delta silhouette — simple nose + swept wings, no tail fins,
    no fork. Matches a classic paper-plane / commercial-jet travel icon."""
    pts = [
        (0, -1.00),  # nose tip
        (0.08, -0.42),  # right fuselage base
        (0.95, 0.32),  # right wingtip
        (0.62, 0.40),  # right wing inner trailing edge
        (0, 0.08),  # fuselage end (simple point, no fork)
        (-0.62, 0.40),  # left wing inner trailing edge
        (-0.95, 0.32),  # left wingtip
        (-0.08, -0.42),  # left fuselage base
    ]
    draw.polygon(poly(cx, cy, scale, 0, pts), fill=color)
    return poly(cx, cy, scale, 0, pts)


def bezier(p0, p1, p2, t):
    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
    return (x, y)


def draw_flame_swoosh(draw, start, control, end, width_start, color, n=28):
    """A single tapered, curved swoosh (quadratic bezier centerline, width
    tapering from width_start down to a point) — one continuous flame/banner
    shape, not separate lines."""
    centerline = [bezier(start, control, end, i / n) for i in range(n + 1)]
    left_edge, right_edge = [], []
    for i, pt in enumerate(centerline):
        t = i / n
        w = width_start * (1 - t) ** 1.3
        if i < len(centerline) - 1:
            nxt = centerline[i + 1]
        else:
            nxt = centerline[i - 1]
            pt, nxt = nxt, pt
        dx, dy = nxt[0] - pt[0], nxt[1] - pt[1]
        length = math.hypot(dx, dy) or 1
        px, py = -dy / length, dx / length
        cxp, cyp = centerline[i]
        left_edge.append((cxp + px * w / 2, cyp + py * w / 2))
        right_edge.append((cxp - px * w / 2, cyp - py * w / 2))
    polygon_pts = left_edge + list(reversed(right_edge))
    draw.polygon(polygon_pts, fill=color)


def draw_badge(draw, cx, cy, scale, ring_color, mark_color, accent_color, ring=True, swoosh_reach=1.0):
    """scale=1 -> ring radius ~460px (fits a 1024 canvas with margin).
    swoosh_reach <1 pulls the flame tail's tip in — used for the Android
    adaptive-icon layers, whose circular safe zone is tighter than the
    full icon.png (where breaking through the ring is intentional)."""
    s = scale

    if ring:
        r = 460 * s
        w = 26 * s
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ring_color, width=int(w))

    plane_scale = 320 * s
    plane_cx, plane_cy = cx - 15 * s, cy - 130 * s
    plane_pts = draw_plane(draw, plane_cx, plane_cy, plane_scale, mark_color)

    # --- Big flame/swoosh trailing from the left wing, through the lower-left
    # of the ring (one continuous tapered shape, not separate lines) ---
    wing_tip = plane_pts[6]  # left wingtip, canvas coords
    wing_in = plane_pts[5]  # left wing inner trailing edge
    start = ((wing_tip[0] + wing_in[0]) / 2 - 10 * s, (wing_tip[1] + wing_in[1]) / 2 + 10 * s)
    control = (cx - 430 * s * swoosh_reach, cy + 120 * s * swoosh_reach)
    end = (cx - 330 * s * swoosh_reach, cy + 480 * s * swoosh_reach)
    draw_flame_swoosh(draw, start, control, end, 150 * s, mark_color)

    # --- Suitcase, overlapping the plane's body slightly, lower-right ---
    case_scale = 155 * s
    case_cx, case_cy = cx + 85 * s, cy + 90 * s
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
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.62, CREAM, CREAM, BRASS, ring=False, swoosh_reach=0.7)
save(fg_img, f"{out}/android-icon-foreground.png")

# 5) android-icon-monochrome.png — transparent, single-color white silhouette
mono_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(mono_img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.62, WHITE, WHITE, WHITE, ring=False, swoosh_reach=0.7)
save(mono_img, f"{out}/android-icon-monochrome.png")

# 6) splash-icon.png — transparent, mark + ring, generously sized for "contain" mode
splash_img = Image.new("RGBA", (CANVAS, CANVAS), TRANSPARENT)
d = ImageDraw.Draw(splash_img)
draw_badge(d, CANVAS / 2, CANVAS / 2, 0.95, CREAM, CREAM, BRASS)
save(splash_img, f"{out}/splash-icon.png")

print("done")
