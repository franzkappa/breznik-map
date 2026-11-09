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
- The SRTM hillshade is **disabled in the GitHub Pages preview**: the public AWS terrarium endpoint does not send CORS headers, so MapLibre cannot read the DEM in the browser. For production, self-host a hillshade or use a CORS-enabled DEM provider.
- CARTO’s own typography is used for **country and sea labels**. All other CARTO symbol layers (cities, roads, POIs) are hidden: the map keeps its own editorial labels for the story places. Four edge labels (Serbia, Romania, Greece, Turkey) and the Black Sea use the same CARTO font stack because country centroids fall outside the initial frame.

The visual treatment in `map.js` applies the OBCT/CIJI palette to the vector style: paper background, one ochre for all roads with hierarchy by width only, one teal for rivers and reservoirs, grey dashed national borders with a paper halo, pale urban areas and buildings from zoom 13. CARTO’s country typography is retained, and all other symbol layers are hidden.

## What is in the map

- **One map**, covering Bulgaria and its immediate neighbours, with Breznik, Krassava reservoir, Sofia, Pernik, Studena, Stomana, Pleven, Gorni Dabnik, Panagyurishte and the Konska river.
- **Locator inset** at bottom right: Bulgaria in the Balkans, with an orange rectangle that updates while the map is panned and zoomed. Clicking the inset recentres the map.
- **Legend inside the map**, in a semi-transparent panel at top left, with a short explanation and a key for point symbols and line/area symbols.
- **Popups** with the article’s key facts. The Breznik popup groups the very local places — Bardo Hill, Milin Kamak, the Konska and the Bardo spring — because at the national scale they would otherwise sit on top of each other. If a popup would overlap the legend, the legend minimises automatically so the popup stays readable.
- **English only** for now; a separate Italian version can be produced later.
- In short iframes (height below 680 px) or narrow ones (width below 760 px) the legend starts collapsed to a single bar with the line “Bulgaria • Water and democracy”; the **+** button expands it.
- Map labels carry only the place name, without a second descriptive line.

## Files

```
index.html                 the iframe-ready map
map.js                     MapLibre setup, CARTO styling, markers, popups, locator
assets/
  locator.webp             Balkans locator basemap
  logos/                   OBCT and CIJI navy logos
vendor/                    MapLibre GL JS 4.7.1
verification/              POI geolocation audit, script and minimal reference data
favicon.ico
```

The map uses the coordinates verified in `verification/`: 10 visible pins plus 3 local POIs (Bardo Hill, Milin Kamak, Bardo spring) described in the Breznik popup. The Bardo spring coordinate was corrected to `42.7313343, 22.9028954`.

## Running and testing

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Network access is required for the CARTO style/tiles and AWS terrain tiles. The CARTO and OpenStreetMap attribution must remain visible; see `verification/README.md` for the POI audit.

## Notes

- The map is now dependent on external CARTO tiles; the old local relief basemap and its rendering scripts have been removed.
- The relief hillshade is disabled in the GitHub preview because of the AWS CORS restriction. The vector basemap is still crisp at every zoom.
- The CARTO road network is more prominent than in the old custom basemap; the palette is adapted through MapLibre paint properties.
- If CARTO is unavailable, the map has no local fallback. For production, decide whether to add one or host/self-style vector tiles.
- To restore relief on GitHub Pages, add a local transparent hillshade overlay or self-host DEM tiles; the direct AWS terrarium URL will keep failing CORS.
