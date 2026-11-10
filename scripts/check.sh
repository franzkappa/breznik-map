#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Sintassi Python =="
python3 - <<'PY'
import ast
from pathlib import Path

for name in [
    "verification/verify_geolocation.py",
    "scripts/build_borders.py",
    "scripts/build_labels.py",
    "scripts/build_map_assets.py",
]:
    ast.parse(Path(name).read_text(encoding="utf-8"), filename=name)
print("sintassi OK")
PY

echo "== Dipendenze =="
python3 -c "import shapely, numpy, PIL" || {
  echo "Mancano dipendenze: pip3 install shapely pillow numpy" >&2
  exit 1
}

echo "== Geolocalizzazione =="
python3 verification/verify_geolocation.py

echo "== Asset richiesti =="
for f in \
  index.html \
  map.js \
  tour.js \
  assets/borders.js \
  assets/place-labels.js \
  assets/locator.webp \
  assets/bulgaria-highlight.js
do
  test -s "$f" || { echo "MANCANTE: $f" >&2; exit 1; }
done

echo "== Sanity check =="
grep -q "const PLACES" index.html
grep -q "new maplibregl.Map" map.js
grep -q "const STOPS" tour.js
grep -q "map.js" index.html
grep -q "tour.js" index.html

echo "OK: controlli superati"
