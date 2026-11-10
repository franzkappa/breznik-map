#!/usr/bin/env python3
"""Build the national-border lines used by the map.

The Bulgarian land border is taken from the same simplified OSM polygon as
the country fill, so the dashed line and the fill edge cannot drift apart.
The rest of the Balkan borders come from Natural Earth's 10m land-boundary
lines: unlike the simplified 50m country polygons, those lines are continuous
and do not break into short fragments.

Maritime stretches are removed: the Bulgarian OSM boundary is clipped to the
Natural Earth land polygon, and the Natural Earth boundary lines used here are
land-only by definition. A border therefore stops where the coast begins.
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

from shapely.geometry import box, shape
from shapely.ops import linemerge, unary_union

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

NE_BORDERS_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_10m_admin_0_boundary_lines_land.geojson"
)
NE_LAND_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_10m_land.geojson"
)
NE_BORDERS_CACHE = Path("/tmp/ne_10m_admin_0_boundary_lines_land.geojson")
NE_LAND_CACHE = Path("/tmp/ne_10m_land.geojson")

# A little wider than map.js ML_MAX, so lines never stop inside the frame.
CLIP = box(17.2, 35.5, 31.8, 49.0)
# The OSM boundary follows the coast within roughly a hundred metres. A small
# buffer keeps river-mouth land borders intact while cutting the sea stretches.
LAND_BUFFER = 0.004


def download(url: str, cache: Path) -> dict:
    if not cache.exists():
        print(f"Downloading {url}")
        urllib.request.urlretrieve(url, cache)
    return json.loads(cache.read_text())


def collect_lines(geom):
    lines = []
    if geom.is_empty:
        return lines
    if geom.geom_type in ("LineString", "LinearRing"):
        lines.append(geom)
    elif geom.geom_type in ("MultiLineString", "GeometryCollection"):
        for part in geom.geoms:
            lines.extend(collect_lines(part))
    return lines


def round_line(line):
    return {
        "type": "LineString",
        "coordinates": [[round(x, 5), round(y, 5)] for x, y in line.coords],
    }


def main() -> None:
    bulgaria = shape(
        json.loads((ASSETS / "bulgaria-osm.geojson").read_text())["features"][0][
            "geometry"
        ]
    )
    neighbors = json.loads((ASSETS / "neighbors-osm.geojson").read_text())

    land_data = download(NE_LAND_URL, NE_LAND_CACHE)
    land = unary_union(
        [
            shape(feature["geometry"]).intersection(CLIP)
            for feature in land_data["features"]
            if shape(feature["geometry"]).intersects(CLIP)
        ]
    )
    land = land.buffer(LAND_BUFFER)

    border_lines = []
    for feature in neighbors["features"]:
        neighbor = shape(feature["geometry"])
        # Keep only the parts of the Bulgarian boundary that touch a neighbour.
        border_lines.extend(
            collect_lines(bulgaria.boundary.intersection(neighbor.buffer(0.003)))
        )

    # Remove the stretches that leave the coast and run through the sea.
    border_lines = [
        line.intersection(land)
        for line in border_lines
        if line.intersection(land).length > 0.002
    ]

    # All other Balkan land borders. Natural Earth's 10m boundary lines are
    # continuous, so the result no longer breaks into hundreds of fragments.
    borders_data = download(NE_BORDERS_URL, NE_BORDERS_CACHE)
    for feature in borders_data["features"]:
        props = feature["properties"]
        if props.get("ADM0_LEFT") == "Bulgaria" or props.get("ADM0_RIGHT") == "Bulgaria":
            continue
        geom = shape(feature["geometry"])
        if not geom.intersects(CLIP):
            continue
        border_lines.extend(collect_lines(geom.intersection(CLIP)))

    merged = linemerge(unary_union(border_lines))

    features = []
    for line in collect_lines(merged):
        # Drop isolated specks left by clipping or topology. Anything shorter
        # than about 2 km would read as a stray dash at high zoom.
        if len(line.coords) < 2 or line.length < 0.02:
            continue
        features.append(
            {"type": "Feature", "properties": {}, "geometry": round_line(line)}
        )

    output = {"type": "FeatureCollection", "features": features}
    out = ASSETS / "borders.js"
    out.write_text(
        "window.BALKAN_BORDERS = "
        + json.dumps(output, separators=(",", ":"))
        + ";\n"
    )
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
