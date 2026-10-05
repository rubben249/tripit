"""Builds src/features/map/countries-110m.json — the country shapes the Map tab highlights.

Source: Natural Earth 1:110m admin-0 countries (public domain). Only the ISO code and name are
kept, and coordinates are rounded to 2 decimals (~1 km — far below what a world-scale globe can
show), which shrinks the file to a fraction of the original.

Run once (or when updating Natural Earth): python3 scripts/build-countries.py
"""
import json
import urllib.request

SOURCE = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
    "geojson/ne_110m_admin_0_countries.geojson"
)
OUT = "src/features/map/countries-110m.json"


def round_coords(value):
    if isinstance(value, list):
        return [round_coords(v) for v in value]
    return round(value, 2)


with urllib.request.urlopen(SOURCE) as res:
    data = json.load(res)

features = []
for f in data["features"]:
    props = f["properties"]
    # ISO_A2 is "-99" for a few countries (France, Norway, Kosovo…); the _EH variant fills those in.
    iso = props["ISO_A2_EH"]
    if iso == "-99":
        continue
    geometry = f["geometry"]
    features.append(
        {
            "type": "Feature",
            "properties": {"iso": iso, "name": props["NAME"]},
            "geometry": {"type": geometry["type"], "coordinates": round_coords(geometry["coordinates"])},
        }
    )

with open(OUT, "w") as out:
    json.dump({"type": "FeatureCollection", "features": features}, out, separators=(",", ":"))

print(f"{len(features)} countries -> {OUT}")
