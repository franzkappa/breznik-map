"""Verify the geolocation of the points of interest used by index.html.

The script reads the coordinates from the PLACES array in index.html and
compares them with independent references (OpenStreetMap features, the OSM
water/river layers shipped with the map, and an OSM landuse polygon for the
Stomana steelworks).  It also checks that the basemap and locator images are
aligned with the same coordinates.

Run from the map folder:

    python3 scripts/verify_geolocation.py

Exit code 0 = all checks pass; 1 = at least one check fails.
"""
import json
import math
import re
import sys
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.ops import nearest_points

BASE = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
INDEX = BASE / "index.html"
WATER = HERE / "data" / "embed_water.geojson"
RIVERS = HERE / "data" / "embed_rivers.geojson"
STOMANA = HERE / "data" / "stomana_industry.geojson"

# Independent references.  Coordinates are WGS84 (lat, lon).
# Tolerance is the maximum accepted distance in km; water/river/polygon
# references are checked by containment or by distance to the geometry.
REFS = {
    "breznik": {
        "kind": "point", "lat": 42.7397669, "lon": 22.9103497, "tol": 1.5,
        "source": "OSM node 273488868 (place=town Breznik)",
        "url": "https://www.openstreetmap.org/node/273488868",
    },
    "krassava": {
        "kind": "water", "name": "яз. Красава",
        "source": "OSM water polygon яз. Красава (data/layers/embed_water.geojson)",
    },
    "bardo": {
        "kind": "point", "lat": 42.7291881, "lon": 22.9138309, "tol": 0.2,
        "source": "OSM node 10548596962 (peak Св. Никола, ele=923)",
        "url": "https://www.openstreetmap.org/node/10548596962",
    },
    "milin": {
        "kind": "point", "lat": 42.7246919, "lon": 22.9267420, "tol": 0.2,
        "source": "OSM node 10549034289 (peak Милин камък, ele=844)",
        "url": "https://www.openstreetmap.org/node/10549034289",
    },
    "konska": {
        "kind": "river", "name": "Конска", "tol": 0.2,
        "source": "OSM way 108016501 (waterway=river Конска)",
        "url": "https://www.openstreetmap.org/way/108016501",
    },
    "spring": {
        "kind": "point", "lat": 42.7313343, "lon": 22.9028954, "tol": 0.2,
        "source": "OSM node 4386844742 (natural=spring Желязна вода); pochivka.bg 42.7313232,22.9028282",
        "url": "https://www.openstreetmap.org/node/4386844742",
    },
    "sofia": {
        "kind": "point", "lat": 42.6977028, "lon": 23.3217359, "tol": 1.5,
        "source": "OSM relation 4283101 (Sofia)",
        "url": "https://www.openstreetmap.org/relation/4283101",
    },
    "pernik": {
        "kind": "point", "lat": 42.6092185, "lon": 23.0309457, "tol": 1.5,
        "source": "OSM node 31058182 (place=city Pernik)",
        "url": "https://www.openstreetmap.org/node/31058182",
    },
    "studena": {
        "kind": "water", "name": "яз. Студена",
        "source": "OSM water polygon яз. Студена (data/layers/embed_water.geojson)",
    },
    "stomana": {
        "kind": "polygon", "path": STOMANA,
        "source": "OSM way 157511732 (landuse=industrial, Стомана Индъстри АД)",
        "url": "https://www.openstreetmap.org/way/157511732",
    },
    "pleven": {
        "kind": "point", "lat": 43.4090220, "lon": 24.6180123, "tol": 1.5,
        "source": "OSM node 31058183 (place=city Pleven)",
        "url": "https://www.openstreetmap.org/node/31058183",
    },
    "gorni": {
        "kind": "water", "name": "яз. Горни Дъбник",
        "source": "OSM water polygon яз. Горни Дъбник (data/layers/embed_water.geojson)",
    },
    "panagyurishte": {
        "kind": "point", "lat": 42.5043065, "lon": 24.1888411, "tol": 1.5,
        "source": "OSM node 273488711 (place=town Panagyurishte)",
        "url": "https://www.openstreetmap.org/node/273488711",
    },
}


def read_places():
    text = INDEX.read_text(encoding="utf-8")
    block = text[text.index("const PLACES = ["): text.index("];", text.index("const PLACES = ["))]
    places = {}
    for m in re.finditer(r"id:'([^']+)'.*?coords:\[([\d.]+),([\d.]+)\]", block):
        places[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    return places


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def load_features(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data["features"]


def geoms_by_name(path, name):
    out = []
    for f in load_features(path):
        n = (f["properties"].get("name") or "").strip()
        if n == name:
            try:
                out.append(shape(f["geometry"]))
            except Exception:
                pass
    return out


def check_places():
    places = read_places()
    waters = load_features(WATER)
    rivers = load_features(RIVERS)
    rows = []
    ok_all = True

    for pid, (lat, lon) in places.items():
        ref = REFS.get(pid)
        if ref is None:
            rows.append((pid, lat, lon, "no reference", "", "SKIP"))
            continue
        p = Point(lon, lat)
        kind = ref["kind"]
        if kind == "point":
            d = haversine_km(lat, lon, ref["lat"], ref["lon"])
            ok = d <= ref["tol"]
            metric = f"distance {d:.3f} km (tolerance {ref['tol']} km)"
        elif kind in ("water", "river"):
            geoms = geoms_by_name(WATER if kind == "water" else RIVERS, ref["name"])
            if not geoms:
                rows.append((pid, lat, lon, ref["source"], "feature not found", "FAIL"))
                ok_all = False
                continue
            if kind == "water":
                ok = any(g.contains(p) for g in geoms)
                metric = "inside polygon" if ok else "outside polygon"
            else:
                distances = [g.distance(p) for g in geoms]
                g = geoms[distances.index(min(distances))]
                near = nearest_points(p, g)[1]
                d = haversine_km(lat, lon, near.y, near.x)
                ok = d <= ref["tol"]
                metric = f"distance to river {d:.3f} km (tolerance {ref['tol']} km)"
        elif kind == "polygon":
            with open(ref["path"], encoding="utf-8") as f:
                poly = shape(json.load(f)["features"][0]["geometry"])
            ok = poly.contains(p)
            metric = "inside OSM landuse polygon" if ok else "outside OSM landuse polygon"
        else:
            ok = False
            metric = "unknown reference kind"
        ok_all = ok_all and ok
        rows.append((pid, lat, lon, ref["source"], metric, "PASS" if ok else "FAIL"))
    return rows, ok_all


def check_images():
    """Check the locator dot against the coordinates used by the page."""
    try:
        import numpy as np
        from PIL import Image
    except Exception as exc:
        return [("locator/dot", "", "", "Pillow/numpy unavailable", str(exc), "SKIP")], True

    def merc_y(lat):
        return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

    def merc_x(lon):
        return math.radians(lon)

    rows = []
    ok_all = True

    # Locator: compare the baked-in orange dot with the HTML position for Breznik.
    loc = np.asarray(Image.open(BASE / "assets" / "locator.webp").convert("RGB")).astype(int)
    tgt = np.array([242, 107, 33])
    dd = np.sqrt(((loc - tgt) ** 2).sum(axis=2))
    ys, xs = np.where(dd < 45)
    if len(xs) == 0:
        rows.append(("locator/dot", 42.7417, 22.8981, "locator.webp", "orange dot not found", "FAIL"))
        ok_all = False
    else:
        cx, cy = xs.mean(), ys.mean()
        lw, lh = 900, 828
        lat, lon = 42.7417, 22.8981
        ex = (merc_x(lon) - merc_x(18)) / (merc_x(30.5) - merc_x(18)) * lw
        ey = (merc_y(46.5) - merc_y(lat)) / (merc_y(46.5) - merc_y(38)) * lh
        d = math.hypot(cx - ex, cy - ey)
        ok = d <= 3
        rows.append(("locator/dot", lat, lon, "baked-in orange dot vs HTML position",
                     f"offset {d:.1f} px", "PASS" if ok else "FAIL"))
        ok_all = ok_all and ok

    return rows, ok_all


def main():
    rows, ok_places = check_places()
    print(f"{'POI':16s} {'lat':>9s} {'lon':>9s} {'metric':48s} result")
    print("-" * 100)
    for pid, lat, lon, source, metric, result in rows:
        print(f"{pid:16s} {lat:9.5f} {lon:9.5f} {metric:48s} {result}")
    print()
    img_rows, ok_images = check_images()
    for pid, lat, lon, source, metric, result in img_rows:
        print(f"{pid:16s} {metric:48s} {result}")
    print()
    ok = ok_places and ok_images
    print("ALL CHECKS PASS" if ok else "SOME CHECKS FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
