# Breznik and the water crisis — interactive map

Single interactive map for the CIJI / OBCT article **“Democracy Running Dry”**, designed to be embedded in an article page.

Open **`index.html`** in a browser, or embed it:

```html
<iframe
  src="index.html"
  title="Breznik and Bulgaria's water crisis — interactive map"
  style="width:100%; height:640px; border:0"
  loading="lazy">
</iframe>
```

The page fills the iframe viewport; the host page only needs to set a height. A height of 560–720 px works well for a 16:10 or 3:2 article column.

## Basemap

The map now uses a **tiled, vector basemap** instead of a single local raster image, so roads and water stay sharp at every zoom level.

- **CARTO Positron** vector style: `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`
- **MapLibre GL JS 4.7.1**, vendored in `vendor/`.
- **Relief**: `ArcGIS World Hillshade` raster tiles, desaturated and blended at low opacity. The service sends CORS headers, so it works on GitHub Pages and from `file://`. The hillshade sits above the land colours but below water, roads and labels.
- CARTO’s own country and sea symbol layers are hidden. Country names and the **Black Sea** are drawn by a custom Montserrat SemiBold layer whose label points sit inside each Natural Earth polygon (or clearly in the sea), so Greece, Turkey and the other neighbours stay on the correct side of the border at every zoom and viewport size.
- **Administrative regions** and **secondary cities** are separate GeoJSON layers, deliberately quieter than the story labels. Region names are the 28 Bulgarian oblasts; the larger cities appear as small dots and labels.
- Bulgaria has a slightly darker warm fill, loaded from `assets/bulgaria-highlight.js`, so it reads as the subject country against its neighbours. The polygon comes from the OSM Bulgaria boundary. A classic `<script>` is used instead of a local GeoJSON fetch so the map also works when `index.html` is opened directly from disk.
- National borders are drawn from `assets/borders.js`: the Bulgarian segments use the **same simplified polygon as the fill**, so the dashed line and the fill edge coincide exactly at every zoom. The other Balkan borders come from Natural Earth’s 10m land-boundary lines, which are continuous instead of breaking into short fragments. Maritime stretches are clipped at the coast, so no border continues into the Black Sea or the Aegean. CARTO’s own boundary lines are hidden.
- The locator inset uses the same Montserrat SemiBold typography, colours and dashed borders as the main map. It is regenerated from Natural Earth with `scripts/build_map_assets.py`.

The visual treatment in `map.js` follows the Le Monde reference: paper background, very light warm-grey roads with a thin grey casing, thin pale-blue rivers, dark-brown dashed national borders, muted administrative labels and pale urban areas/buildings from zoom 13.

## What is in the map

- **One map**, covering Bulgaria and its immediate neighbours, with Breznik, Krassava reservoir, Sofia, Pernik, Studena, Stomana, Pleven, Gorni Dabnik, Panagyurishte and the Konska river.
- **Hillshade relief** in transparency across the whole frame, with the Rhodopes, Pirin, Stara Planina and the Danube plain clearly readable.
- **Administrative region labels** for the Bulgarian oblasts, plus a quiet layer of larger secondary cities. The story labels remain the strongest typography.
- **Locator inset** at bottom right: Bulgaria in the Balkans, with an orange rectangle that updates while the map is panned and zoomed. Clicking the inset recentres the map.
- **Legend inside the map**, in a semi-transparent panel at top left, with a short explanation and a key for the point and line symbols used on the map. Points sit in the left column and lines in the right one.
- **Guided tour bar** at the bottom centre: previous/next buttons move through the nine story stops and open the matching popup; a dedicated **Overview** button returns to the general view.
- **Popups** with the article’s key facts. The Breznik popup groups the very local places — Bardo Hill, Milin Kamak, the Konska and the Bardo spring — because at the national scale they would otherwise sit on top of each other. If a popup would overlap the legend, the legend minimises automatically so the popup stays readable. On phones, a direct tap on a pin nudges the map so the whole popup stays on screen and above the tour bar.
- **English only** for now; a separate Italian version can be produced later.
- In short iframes (height below 680 px) or narrow ones (width below 760 px) the legend starts collapsed to a single bar with the line “Bulgaria • Water and democracy”; the **+** button expands it.
- **Phone layout**: the “Tour” word is dropped to shorten the bar, the partner logos sit on the same bottom line on the left, the locator sits above it, the legend can be opened without covering the whole screen, and popups shrink to the viewport and scroll when a short landscape viewport would clip them. Safe-area insets are respected.
- Map labels carry only the place name, without a second descriptive line.

## Guided tour

The guided tour is integrated into `index.html`; `tour.html` is only a redirect kept for old links.

- A **Tour** bar at the bottom centre has **‹** and **›** buttons, a counter (`1 / 9`) and an **Overview** button that flies back to the full Bulgaria frame.
- Each button flies to the next or previous pin in story order — Breznik, Krassava, Konska, Pernik, Studena, Stomana, Panagyurishte, Pleven, Gorni Dabnik — and opens that place’s popup when the movement ends. The stops are deliberately close-in (zoom 10.4–13.0) so each place reads as a place rather than as a point on a national map.
- The two ends of the sequence are disabled: **‹** on the first stop, **›** on the last. **Overview** also resets the counter and clears the active pin.
- Clicking a pin directly also updates the counter, so the buttons continue from the place the reader just opened.
- The **left and right arrow keys** do the same when the page or the tour bar has focus. When the map canvas has focus the arrows keep panning the map instead. **Home** returns to the general view.
- The buttons respect `prefers-reduced-motion`: the map jumps without animation and opens the popup immediately.

## Files

```
index.html                 the iframe-ready map, with the integrated guided tour
tour.html                  redirect to index.html for old links
map.js                     MapLibre setup, CARTO styling, markers, popups, locator
tour.js                    guided-tour sequence, buttons and keyboard controls
scripts/
  build_map_assets.py      rebuilds the locator inset and the highlight script
  build_borders.py         rebuilds the national-border lines (OSM + Natural Earth 10m)
  build_labels.py          rebuilds the region and city label layers
assets/
  bulgaria-highlight.js    runtime OSM Bulgaria polygon (works from file://)
  bulgaria-osm.geojson     source polygon for the highlight and Bulgarian borders
  neighbors-osm.geojson    OSM neighbour polygons used to clip the Bulgarian border
  borders.js               national-border lines, land-only (Bulgarian segments share the fill geometry)
  place-labels.js          administrative region and secondary-city label points
  balkans-countries.geojson  Natural Earth polygons used to build the locator
  locator.webp             Balkans locator basemap, Montserrat labels
  logos/                   OBCT and CIJI navy logos
vendor/                    MapLibre GL JS 4.7.1
verification/              POI geolocation audit, script and minimal reference data
favicon.ico
```

The map uses the coordinates verified in `verification/`: 9 pins plus Sofia as a label-only reference (no pin or popup), and 3 local POIs (Bardo Hill, Milin Kamak, Bardo spring) described in the Breznik popup. The Bardo spring coordinate was corrected to `42.7313343, 22.9028954`.

## Running and testing

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

You can also open `index.html` directly from disk; the local highlight, borders and labels are scripts, not fetched GeoJSON files. Network access is required for the CARTO style/tiles and the ArcGIS hillshade. The CARTO, OpenStreetMap and Esri/USGS/NASA attributions must remain visible; see `verification/README.md` for the POI audit.

To rebuild the locator inset and the `bulgaria-highlight.js` wrapper after a palette or typography change:

```bash
python3 scripts/build_map_assets.py   # locator + Bulgarian fill wrapper
python3 scripts/build_borders.py      # dashed national borders
python3 scripts/build_labels.py       # oblast and city labels
```

`build_map_assets.py` downloads Natural Earth 50m data on its first run and expects Montserrat SemiBold in `~/Library/Fonts`; use `--font` and `--font-italic` to point elsewhere. `build_borders.py` downloads Natural Earth 10m land and land-boundary lines on its first run. `build_labels.py` downloads Natural Earth 10m admin-1 on its first run.

## Notes

- The map depends on external CARTO vector tiles and ArcGIS hillshade tiles; the old local relief basemap and its rendering scripts have been removed.
- Roads are intentionally light, following the Le Monde reference. Their hierarchy comes from width and casing rather than dark colour.
- If CARTO or the hillshade service is unavailable, the map still renders the vector base without relief. For production, evaluate self-hosting both tile sets.
- The Bulgarian border and fill now come from the same simplified OSM polygon; keep `bulgaria-osm.geojson`, `bulgaria-highlight.js` and `borders.js` in sync when updating the boundary.
