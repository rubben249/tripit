"""Regenerates the app icon set — assets/images/{icon,favicon,splash-icon,android-icon-*}.png and
public/apple-touch-icon.png — from the user's own logo (scripts/source/user-logo-reference.png):
plane + luggage inside a circle, in the Atlas Umber palette.

Per the user (2026-10-06): "avión con maleta y círculo, no estela". The reference's swoosh is
fused to the plane's tail, so it can't simply be deleted:
  * the plane is mirror-symmetric about the diagonal x + y = 388 (source px), with its tail
    pointing down-left into the swoosh; it's cut where the fuselage is still narrow, just before
    the swoosh flares out, and closed with tail stabilizers made from a scaled copy of its own
    wings (so the tail is drawn in exactly the same hand as the rest);
  * the ring in the reference is open where the swoosh crossed it, so it's redrawn as a clean
    circle fitted to the original ring (center, radius, thickness);
  * the luggage (small bag half-hidden by the plane, suitcase with handle) is kept as is.

Everything is taken from the reference as an anti-aliased alpha mask at 4× resolution, recolored
cream on the espresso gradient. Run with: python3 scripts/generate-logo.py [--preview out.png]
(supersedes generate-logo-t.py, extract_user_logo.py and generate-app-icon.py).
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "source", "user-logo-reference.png")
OUT = os.path.join(ROOT, "assets", "images")
PUBLIC = os.path.join(ROOT, "public")

INK_TOP = np.array([43, 30, 18])  # brand.ink #2B1E12
INK_BOTTOM = np.array([15, 10, 6])  # near-black espresso
CREAM = np.array([247, 241, 230])  # brand.paper #F7F1E6

K = 4  # work at 4× the reference's resolution for smooth edges
AXIS = 388  # plane's mirror axis: x + y = AXIS (source px)
TAIL_CUT = 96  # where the fuselage is cut, measured along the axis as u = y - x (source px)
NOSE_FROM, NOSE_TO = -142, -100  # nose section (tip trimmed), reflected for the tail cone
STAB_FROM, STAB_TO = -20, 80  # wing section copied for the tail stabilizers (u range)
STAB_SCALE = 0.36
STAB_AT = 94  # where the copied section's front lands (u)
RING_CENTER = (201.7, 211.5)  # least-squares fit of the reference ring (source px)
RING_RADIUS = 144.5
RING_HALF_WIDTH = 5.5
CROP = (48, 59, 356, 364)  # square around the ring, with a little air (source px)


def load_alpha():
    src = Image.open(SRC).convert("L")
    big = np.asarray(src.resize((src.width * K, src.height * K), Image.LANCZOS)).astype(float)
    return np.clip((big - 40) / (230 - 40), 0, 1)  # navy → 0, white → 1


def axis_point(u):
    """Point on the plane's axis at position u = y - x, as (x, y) at K× scale."""
    return np.array([(AXIS - u) / 2 * K, (AXIS + u) / 2 * K])


def build_mark(alpha):
    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    by_size = np.argsort(sizes)[::-1] + 1
    plane_label, ring_label = by_size[0], by_size[1]

    h, w = solid.shape
    yy, xx = np.mgrid[0:h, 0:w]
    u = (yy - xx) / K

    def grow(mask):  # include the anti-aliased fringe around each shape
        return ndimage.binary_dilation(mask, iterations=3)

    plane = grow(labels == plane_label)
    luggage = grow((labels > 0) & (labels != plane_label) & (labels != ring_label))

    # Fuselage + wings, up to the cut.
    front = plane & (u <= TAIL_CUT)

    # Tail cone: the nose, reflected through a point on the axis so its base meets the cut —
    # the plane ends in the same tapered curve it starts with.
    m = axis_point((TAIL_CUT + NOSE_TO) / 2)
    rx = np.rint(2 * m[0] - xx).astype(int)
    ry = np.rint(2 * m[1] - yy).astype(int)
    ok = (rx >= 0) & (rx < w) & (ry >= 0) & (ry < h)
    nose = plane & (u >= NOSE_FROM) & (u <= NOSE_TO)
    cone_alpha = np.zeros_like(alpha)
    cone_alpha[ok] = alpha[ry[ok], rx[ok]] * nose[ry[ok], rx[ok]]

    # Stabilizers: the wing section, scaled down about the axis and moved to the tail.
    a, b = axis_point(STAB_FROM), axis_point(STAB_AT)
    sx = np.rint(a[0] + (xx - b[0]) / STAB_SCALE).astype(int)
    sy = np.rint(a[1] + (yy - b[1]) / STAB_SCALE).astype(int)
    inside = (sx >= 0) & (sx < w) & (sy >= 0) & (sy < h)
    wing = plane & (u >= STAB_FROM) & (u <= STAB_TO)
    stab_mask = np.zeros_like(plane)
    stab_mask[inside] = wing[sy[inside], sx[inside]]
    stab_alpha = np.zeros_like(alpha)
    stab_alpha[inside] = alpha[sy[inside], sx[inside]] * stab_mask[inside]

    shapes = np.where(front | luggage, alpha, 0)
    # Keep the original's thin gap between the plane and the luggage around the new tail too.
    gap = ndimage.binary_dilation(luggage, iterations=4 * K)
    tail = np.where(gap, 0, np.maximum(stab_alpha, cone_alpha))
    shapes = np.maximum(shapes, tail)

    # Clean ring, anti-aliased by distance to the circle.
    cx, cy = RING_CENTER[0] * K, RING_CENTER[1] * K
    dist = np.abs(np.hypot(xx - cx, yy - cy) - RING_RADIUS * K)
    ring = np.clip(RING_HALF_WIDTH * K - dist + 0.5, 0, 1)

    mark = np.maximum(shapes, ring)
    x0, y0, x1, y1 = (v * K for v in CROP)
    return mark[y0:y1, x0:x1]


def gradient(size):
    t = np.linspace(0, 1, size)[:, None, None]
    return np.broadcast_to(INK_TOP * (1 - t) + INK_BOTTOM * t, (size, size, 3))


def on_background(mark, size, inset=0.0):
    """Cream mark on the espresso gradient, the mark scaled to leave `inset` margin per side."""
    mark_img = Image.fromarray((mark * 255).astype(np.uint8))
    inner = round(size * (1 - 2 * inset))
    m = np.asarray(mark_img.resize((inner, inner), Image.LANCZOS)).astype(float) / 255
    full = np.zeros((size, size))
    off = (size - inner) // 2
    full[off : off + inner, off : off + inner] = m
    rgb = gradient(size) * (1 - full[..., None]) + CREAM * full[..., None]
    return Image.fromarray(rgb.astype(np.uint8), "RGB")


def transparent(mark, size, inset, color=CREAM):
    mark_img = Image.fromarray((mark * 255).astype(np.uint8))
    inner = round(size * (1 - 2 * inset))
    m = mark_img.resize((inner, inner), Image.LANCZOS)
    alpha = Image.new("L", (size, size), 0)
    alpha.paste(m, ((size - inner) // 2, (size - inner) // 2))
    img = Image.new("RGBA", (size, size), tuple(int(c) for c in color) + (0,))
    img.putalpha(alpha)
    return img


def main():
    mark = build_mark(load_alpha())

    if "--preview" in sys.argv:
        on_background(mark, 512, inset=0.08).save(sys.argv[sys.argv.index("--preview") + 1])
        return

    icon = on_background(mark, 1024, inset=0.08)
    icon.save(os.path.join(OUT, "icon.png"))
    icon.resize((196, 196), Image.LANCZOS).save(os.path.join(OUT, "favicon.png"))
    # iOS ignores alpha on the home-screen icon, so it gets the opaque version.
    icon.resize((180, 180), Image.LANCZOS).save(os.path.join(PUBLIC, "apple-touch-icon.png"))
    # Android adaptive icon: background + foreground kept inside the circular safe zone (~66%).
    Image.fromarray(gradient(1024).astype(np.uint8), "RGB").save(
        os.path.join(OUT, "android-icon-background.png")
    )
    transparent(mark, 1024, inset=0.2).save(os.path.join(OUT, "android-icon-foreground.png"))
    transparent(mark, 1024, inset=0.2, color=np.array([255, 255, 255])).save(
        os.path.join(OUT, "android-icon-monochrome.png")
    )
    transparent(mark, 1024, inset=0.08).save(os.path.join(OUT, "splash-icon.png"))
    print("wrote icon, favicon, apple-touch-icon, android-icon-*, splash-icon")


if __name__ == "__main__":
    main()
