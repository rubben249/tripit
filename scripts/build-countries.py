"""Builds src/features/map/countries.json — the country shapes the Map tab highlights.

Source: Natural Earth 1:50m admin-0 countries (public domain). The 1:110m set is lighter but
visibly crude once the map zooms to a single country (Sicily becomes a triangle), so this starts
from 1:50m and simplifies each ring with Douglas–Peucker at 0.04° (~4 km, 1–2 px at country
zoom), rounding coordinates to 2 decimals. Only the ISO code and name are kept.

Run once (or when updating Natural Earth): python3 scripts/build-countries.py
"""
import json
import math
import urllib.request

SOURCE = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_50m_admin_0_countries.geojson"
)
OUT = "src/features/map/countries.json"
TOLERANCE_DEG = 0.04


def simplify(points, eps):
    """Douglas–Peucker, iterative so long coastlines can't hit Python's recursion limit."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        ax, ay = points[start]
        bx, by = points[end]
        dx, dy = bx - ax, by - ay
        length = math.hypot(dx, dy)
        best, index = 0.0, None
        for i in range(start + 1, end):
            px, py = points[i]
            if length:
                dist = abs(dy * px - dx * py + bx * ay - by * ax) / length
            else:
                dist = math.hypot(px - ax, py - ay)
            if dist > best:
                best, index = dist, i
        if index is not None and best > eps:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def ring(points):
    simplified = [[round(x, 2), round(y, 2)] for x, y in simplify(points, TOLERANCE_DEG)]
    return simplified if len(simplified) >= 4 else None


def multipolygon(geometry):
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    out = []
    for polygon in polygons:
        rings = [ring(r) for r in polygon]
        if rings[0] is None:  # outer ring collapsed: an islet below the tolerance
            continue
        out.append([r for r in rings if r])
    return {"type": "MultiPolygon", "coordinates": out}


with urllib.request.urlopen(SOURCE) as res:
    data = json.load(res)

features = []
for f in data["features"]:
    props = f["properties"]
    # ISO_A2 is "-99" for a few countries (France, Norway, Kosovo…); the _EH variant fills those in.
    iso = props["ISO_A2_EH"]
    if iso == "-99":
        continue
    features.append(
        {
            "type": "Feature",
            "properties": {"iso": iso, "name": props["NAME"]},
            "geometry": multipolygon(f["geometry"]),
        }
    )

with open(OUT, "w") as out:
    json.dump({"type": "FeatureCollection", "features": features}, out, separators=(",", ":"))

print(f"{len(features)} countries -> {OUT}")
