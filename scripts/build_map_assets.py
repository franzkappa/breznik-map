#!/usr/bin/env python3
"""Build the local map assets from Natural Earth data.

Outputs:
  assets/balkans-countries.geojson  Natural Earth polygons used to build the
                                    locator inset
  assets/locator.webp               locator basemap, labelled with the same
                                    Montserrat stack as the main map
  assets/bulgaria-highlight.js      OSM Bulgaria polygon wrapped in a classic
                                    script for the main-map highlight

Requirements: Python 3, Pillow, Shapely.
The Montserrat TTF files are looked up in ~/Library/Fonts by default; pass
--font and --font-italic to use another location.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from shapely.geometry import box, mapping, shape

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
CACHE = Path("/tmp/ne_50m_admin_0_countries.geojson")
NE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_50m_admin_0_countries.geojson"
)

# Same extent as LOC in map.js: south/west, north/east.
LOC = (38.0, 18.0, 46.5, 30.5)
# Country polygons around the map, with a little breathing room.
CLIP = box(16.0, 34.0, 34.0, 49.0)
SIMPLIFY = 0.01

PAPER = "#f4eee2"
SEA = "#cfe4e6"
LAND = "#f1ebdf"
BULGARIA = "#eadfc7"
BORDER = "#5b3d2a"
TEXT = "#4f554c"
SEA_TEXT = "#4c7d87"

LABELS = [
    # text, longitude, latitude, font size in final 900 px image, italic
    ("ROMANIA", 25.00, 45.55, 14, False),
    ("SERBIA", 20.35, 43.65, 14, False),
    ("BULGARIA", 25.20, 42.78, 33, False),
    ("N. MACEDONIA", 21.60, 41.68, 14, False),
    ("GREECE", 22.55, 40.15, 14, False),
    ("TURKEY", 28.25, 40.55, 14, False),
    ("BLACK SEA", 28.98, 43.15, 14, True),
]


def download_natural_earth() -> dict:
    if not CACHE.exists():
        print(f"Downloading {NE_URL}")
        urllib.request.urlretrieve(NE_URL, CACHE)
    return json.loads(CACHE.read_text())


def round_coords(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 4), round(coords[1], 4)]
    return [round_coords(part) for part in coords]


def build_countries() -> None:
    data = download_natural_earth()
    features = []
    for feature in data["features"]:
        geom = shape(feature["geometry"])
        if not geom.intersects(CLIP):
            continue
        geom = geom.intersection(CLIP).simplify(SIMPLIFY, preserve_topology=True)
        if geom.is_empty:
            continue
        payload = mapping(geom)
        if payload["type"] == "Polygon":
            payload["coordinates"] = round_coords(payload["coordinates"])
        elif payload["type"] == "MultiPolygon":
            payload["coordinates"] = [round_coords(p) for p in payload["coordinates"]]
        props = feature["properties"]
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "name": props.get("ADMIN"),
                    "iso": props.get("ADM0_A3"),
                },
                "geometry": payload,
            }
        )
    out = {"type": "FeatureCollection", "features": features}
    path = ASSETS / "balkans-countries.geojson"
    path.write_text(json.dumps(out, separators=(",", ":")))
    print(f"Wrote {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.0f} KB)")


def build_highlight() -> None:
    """Wrap the OSM Bulgaria boundary in a classic script.

    A script tag works from file:// as well, while a local fetch of a
    GeoJSON file is blocked by the browser.
    """
    src = ASSETS / "bulgaria-osm.geojson"
    if not src.exists():
        print(f"Skipping {src.name}: file not found")
        return
    data = json.loads(src.read_text())
    out = ASSETS / "bulgaria-highlight.js"
    out.write_text(
        "window.BULGARIA_HIGHLIGHT = "
        + json.dumps(data, separators=(",", ":"))
        + ";\n"
    )
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


def mercator_y(lat: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def project(lon: float, lat: float, width: int, height: int) -> tuple[float, float]:
    south, west, north, east = LOC
    x = (lon - west) / (east - west)
    y = (mercator_y(north) - mercator_y(lat)) / (mercator_y(north) - mercator_y(south))
    return x * width, y * height


def rings(geom):
    if geom.geom_type == "Polygon":
        return [geom.exterior] + list(geom.interiors)
    if geom.geom_type == "MultiPolygon":
        result = []
        for poly in geom.geoms:
            result.append(poly.exterior)
            result.extend(poly.interiors)
        return result
    return []


def dashed_line(draw, points, dash=5.0, gap=4.0, fill=BORDER, width=1):
    """Draw a dashed polyline, carrying the dash pattern across vertices."""
    if len(points) < 2:
        return
    pattern = [dash, gap]
    index = 0
    remaining = pattern[0]
    drawing = True
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        seg = math.hypot(x2 - x1, y2 - y1)
        if seg == 0:
            continue
        t = 0.0
        while t < seg:
            step = min(remaining, seg - t)
            if drawing:
                ax = x1 + (x2 - x1) * (t / seg)
                ay = y1 + (y2 - y1) * (t / seg)
                bx = x1 + (x2 - x1) * ((t + step) / seg)
                by = y1 + (y2 - y1) * ((t + step) / seg)
                draw.line([(ax, ay), (bx, by)], fill=fill, width=width)
            t += step
            remaining -= step
            if remaining <= 1e-9:
                index = (index + 1) % len(pattern)
                remaining = pattern[index]
                drawing = not drawing


def tracked_text(draw, xy, text, font, tracking, fill, halo, halo_width):
    """Draw text with letter spacing and a halo, like the map labels."""
    x, y = xy
    stroke = halo_width
    for char in text:
        draw.text((x, y), char, font=font, fill=fill, stroke_width=stroke, stroke_fill=halo)
        advance = draw.textlength(char, font=font)
        x += advance + tracking
    return x


def text_width(draw, text, font, tracking):
    return sum(draw.textlength(ch, font=font) for ch in text) + tracking * max(0, len(text) - 1)


def build_locator(font_path: Path, italic_path: Path) -> None:
    data = json.loads((ASSETS / "balkans-countries.geojson").read_text())
    final_w, final_h = 900, 829
    scale = 2
    w, h = final_w * scale, final_h * scale

    image = Image.new("RGB", (w, h), SEA)
    draw = ImageDraw.Draw(image)

    for feature in data["features"]:
        geom = shape(feature["geometry"])
        name = feature["properties"]["name"]
        fill = BULGARIA if name == "Bulgaria" else LAND
        for ring in rings(geom):
            pts = [project(lon, lat, w, h) for lon, lat in ring.coords]
            if len(pts) < 3:
                continue
            draw.polygon(pts, fill=fill)
        for ring in rings(geom):
            pts = [project(lon, lat, w, h) for lon, lat in ring.coords]
            dashed_line(draw, pts, dash=5.0 * scale, gap=4.0 * scale, width=scale)

    regular = ImageFont.truetype(str(font_path), 14 * scale)
    bold = ImageFont.truetype(str(font_path), 33 * scale)
    italic = ImageFont.truetype(str(italic_path), 14 * scale)

    for text, lon, lat, size, is_italic in LABELS:
        font = italic if is_italic else (bold if size == 33 else regular)
        tracking = (0.12 if is_italic else 0.09) * size * scale
        fill = SEA_TEXT if is_italic else TEXT
        halo = SEA if is_italic else PAPER
        x, y = project(lon, lat, w, h)
        text = text.upper()
        tw = text_width(draw, text, font, tracking)
        # Approximate cap-height centring; PIL anchors text by its ascender.
        bbox = draw.textbbox((0, 0), text, font=font)
        th = bbox[3] - bbox[1]
        tracked_text(
            draw,
            (x - tw / 2, y - th / 2 - bbox[1]),
            text,
            font,
            tracking,
            fill,
            halo,
            1.3 * scale,
        )

    image = image.resize((final_w, final_h), Image.LANCZOS)
    out = ASSETS / "locator.webp"
    image.save(out, "WEBP", quality=90, method=6)
    print(f"Wrote {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--font",
        type=Path,
        default=Path(os.path.expanduser("~/Library/Fonts/Montserrat-SemiBold.ttf")),
    )
    parser.add_argument(
        "--font-italic",
        type=Path,
        default=Path(os.path.expanduser("~/Library/Fonts/Montserrat-SemiBoldItalic.ttf")),
    )
    args = parser.parse_args()

    ASSETS.mkdir(exist_ok=True)
    build_countries()
    build_highlight()
    if not args.font.exists() or not args.font_italic.exists():
        raise SystemExit(
            "Montserrat SemiBold TTF not found. Pass --font and --font-italic."
        )
    build_locator(args.font, args.font_italic)


if __name__ == "__main__":
    main()
