#!/usr/bin/env python3
"""Build the administrative-region and secondary-city labels.

Region label points come from Natural Earth 10m admin-1 (Bulgaria's 28
oblasts). Cities are a curated list of the larger Bulgarian cities that are
not already story labels.
"""

from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
CACHE = Path("/tmp/ne_10m_admin_1_states_provinces.geojson")
URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_10m_admin_1_states_provinces.geojson"
)

# The story labels already identify these places; skip duplicate region labels.
# The five largest cities are labelled as cities at the base zoom, so their
# region labels would only duplicate the same name.
SKIP_REGIONS = {
    "Sofia",
    "Pernik",
    "Pleven",
    "Plovdiv",
    "Varna",
    "Burgas",
    "Ruse",
    "Stara Zagora",
}

CITIES = [
    ("Plovdiv", 42.1354, 24.7453, 1),
    ("Varna", 43.2141, 27.9147, 1),
    ("Burgas", 42.5063, 27.4678, 1),
    ("Ruse", 43.8487, 25.9544, 1),
    ("Stara Zagora", 42.4258, 25.6345, 1),
    ("Blagoevgrad", 42.0209, 23.0943, 2),
    ("Vratsa", 43.2102, 23.5529, 2),
    ("Montana", 43.4085, 23.2257, 2),
    ("Dobrich", 43.5726, 27.8273, 2),
    ("Shumen", 43.2712, 26.9361, 2),
    ("Haskovo", 41.9344, 25.5554, 2),
    ("Veliko Tarnovo", 43.0757, 25.6172, 2),
    ("Vidin", 43.9960, 22.8679, 2),
    ("Kyustendil", 42.2833, 22.6833, 2),
    ("Pazardzhik", 42.1920, 24.3336, 2),
    ("Smolyan", 41.5775, 24.7128, 2),
    ("Sliven", 42.6817, 26.3229, 2),
    ("Yambol", 42.4833, 26.5000, 2),
    ("Kardzhali", 41.6333, 25.3667, 2),
    ("Gabrovo", 42.8742, 25.3342, 2),
    ("Lovech", 43.1333, 24.7167, 2),
    ("Silistra", 44.1167, 27.2667, 2),
    ("Razgrad", 43.5333, 26.5167, 2),
    ("Targovishte", 43.2500, 26.5667, 2),
]


def natural_earth() -> dict:
    if not CACHE.exists():
        print(f"Downloading {URL}")
        urllib.request.urlretrieve(URL, CACHE)
    return json.loads(CACHE.read_text())


def main() -> None:
    data = natural_earth()
    regions = []
    seen = set()
    for feature in data["features"]:
        props = feature["properties"]
        if props.get("adm0_a3") != "BGR":
            continue
        name = props.get("name_en") or props.get("name")
        if not name or name in SKIP_REGIONS or name in seen:
            continue
        seen.add(name)
        lat, lon = props.get("latitude"), props.get("longitude")
        if lat is None or lon is None:
            continue
        regions.append(
            {
                "type": "Feature",
                "properties": {"kind": "region", "name": name},
                "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
            }
        )

    cities = [
        {
            "type": "Feature",
            "properties": {"kind": "city", "name": name, "rank": rank},
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        }
        for name, lat, lon, rank in CITIES
    ]

    output = {"type": "FeatureCollection", "features": regions + cities}
    out = ASSETS / "place-labels.js"
    out.write_text(
        "window.PLACE_LABELS = "
        + json.dumps(output, separators=(",", ":"))
        + ";\n"
    )
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
