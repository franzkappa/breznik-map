#!/usr/bin/env python3
"""Build the national-border lines used by the map.

The Bulgarian land border is taken from the same simplified OSM polygon as
the country fill, so the dashed line and the fill edge cannot drift apart.
Other national borders come from the Natural Earth country polygons that are
already used to build the locator inset.
"""

from __future__ import annotations

import itertools
import json
from pathlib import Path

from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"


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
    payload = mapping(line)
    payload["coordinates"] = [
        [round(x, 5), round(y, 5)] for x, y in payload["coordinates"]
    ]
    return payload


def main() -> None:
    bulgaria = shape(json.loads((ASSETS / "bulgaria-osm.geojson").read_text())["features"][0]["geometry"])

    border_lines = []
    neighbours = json.loads((ASSETS / "neighbors-osm.geojson").read_text())
    for feature in neighbours["features"]:
        neighbour = shape(feature["geometry"])
        # Keep only the parts of the Bulgarian boundary that touch a neighbour.
        border_lines.extend(
            collect_lines(bulgaria.boundary.intersection(neighbour.buffer(0.003)))
        )

    countries_fc = json.loads((ASSETS / "balkans-countries.geojson").read_text())
    countries = {
        f["properties"]["name"]: shape(f["geometry"])
        for f in countries_fc["features"]
    }
    others = {name: geom for name, geom in countries.items() if name != "Bulgaria"}
    for a, b in itertools.combinations(sorted(others), 2):
        first, second = others[a], others[b]
        if not first.intersects(second):
            continue
        border_lines.extend(
            collect_lines(first.boundary.intersection(second.buffer(0.002)))
        )

    unique = {}
    for line in border_lines:
        key = tuple((round(x, 4), round(y, 4)) for x, y in line.coords)
        unique.setdefault(key, line)

    features = [
        {"type": "Feature", "properties": {}, "geometry": round_line(line)}
        for line in unique.values()
    ]
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
