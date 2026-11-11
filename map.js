/* CARTO vector basemap + MapLibre, isolated prototype.
   Data and the popup HTML live in the inline script in index.html. */

const CARTO_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
// MapLibre order: west, south / east, north
const ML_VIEW = [[21.35, 41.20], [28.95, 44.50]];
const ML_MAX = [[17.2, 35.5], [31.8, 49.0]];

/* Keep the general view clear of the tour bar and the locator, especially on
   phones. The same padding is used at load and by the Overview button. */
function overviewPadding() {
  if (window.innerWidth <= 520) {
    return { top: 18, bottom: 104, left: 14, right: 14 };
  }
  if (window.innerWidth <= 760) {
    return { top: 20, bottom: 96, left: 18, right: 18 };
  }
  return { top: 24, bottom: 76, left: 24, right: 24 };
}

const map = new maplibregl.Map({
  container: 'map',
  style: CARTO_STYLE,
  center: [24.65, 42.85],
  zoom: 6.4,
  minZoom: 4.8,
  maxZoom: 13.4,
  maxBounds: ML_MAX,
  attributionControl: false,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  fadeDuration: 180
});

map.touchZoomRotate.disableRotation();
map.dragRotate.disable();
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 110 }), 'bottom-left');

let currentPopup = null;

/* Bardo Hill, Milin Kamak and the Bardo spring sit within 3 km of Breznik. On
   the national view that whole group covers a handful of pixels, so their pins
   would pile up on each other. The pins therefore appear from DETAIL_ZOOM and
   their labels only from DETAIL_LABEL_ZOOM: at 11.5 the four labels are 56–91
   px wide and the places are 35–55 px apart, so the names of Bardo Hill and the
   spring overlap each other and their pins. Below DETAIL_ZOOM their content
   still lives in the Breznik popup. */
const DETAIL_ZOOM = 11;
const DETAIL_LABEL_ZOOM = 12;
/* River names appear as straight words from this zoom. Below it the basemap
   itself has no river names and the drawn lines are too small to label. */
const RIVER_LABEL_MIN_ZOOM = 9;
const detailPinEls = [];
const detailLabelEls = [];
let pinsShown = false;
let labelsShown = false;

/* ------------------------------------------------------------------ style */
function setP(id, prop, value) {
  if (map.getLayer(id)) map.setPaintProperty(id, prop, value);
}
function setL(id, prop, value) {
  if (map.getLayer(id)) map.setLayoutProperty(id, prop, value);
}

function applyEditorialStyle() {
  setP('background', 'background-color', '#f4eee2');

  ['landcover', 'landuse', 'park_national_park', 'park_nature_reserve'].forEach(id => {
    setP(id, 'fill-color', 'rgba(226, 217, 198, .33)');
  });
  setP('landuse_residential', 'fill-color', 'rgba(227, 216, 194, .42)');

  setP('water', 'fill-color', '#cfe4e6');
  setP('water_shadow', 'fill-color', 'rgba(143, 185, 192, .18)');
  // Rivers and lakes use the same tint as the sea, so all water reads as one
  // element. The line is kept above the country fill and hillshade but below
  // the water fills, so it never shows through across a lake.
  setP('waterway', 'line-color', '#cfe4e6');
  // One width for every watercourse made the big rivers too faint and the
  // small ones too heavy. The width is now a zoom ramp whose stops carry a
  // factor that follows the OSM waterway class: rivers gain a little weight,
  // canals sit just below them, and streams, drains and ditches — the latter
  // two only drawn from z13 — stay thin so the map does not crowd at city
  // zooms. MapLibre only allows one zoom expression, and it has to be the
  // outermost one, so the class is resolved inside each stop.
  const kinds = (river, canal, stream, ditch) => ['case',
    ['==', ['get', 'kind'], 'river'], river,
    ['==', ['get', 'kind'], 'canal'], canal,
    ['in', ['get', 'kind'], ['literal', ['drain', 'ditch']]], ditch,
    stream
  ];
  setP('waterway', 'line-width', ['interpolate', ['linear'], ['zoom'],
    5, kinds(1.2, 1, .7, .5),
    9, kinds(1.7, 1.4, 1, .65),
    12, kinds(2.2, 1.9, 1.35, .8),
    14, kinds(2.8, 2.4, 1.65, 1)
  ]);
  setP('waterway', 'line-opacity', 1);

  map.getStyle().layers.forEach(layer => {
    const id = layer.id;

    if (id.includes('rail') || id.includes('aeroway') || id === 'road_path_areas') {
      setL(id, 'visibility', 'none');
      return;
    }

    if (id === 'building' || id === 'building-top') {
      setP(id, 'fill-color', id === 'building' ? 'rgba(214, 203, 184, .72)' : 'rgba(227, 216, 194, .82)');
      map.setLayerZoomRange(id, 13, 24);
      return;
    }

    if (layer['source-layer'] === 'roads' && layer.type === 'line') {
      if (id.includes('path')) {
        setP(id, 'line-color', '#e3dfd4');
        setP(id, 'line-width', ['interpolate', ['linear'], ['zoom'], 12, .5, 15, 1.6]);
        map.setLayerZoomRange(id, 12, 24);
        return;
      }

      const isCase = id.includes('case');
      const isMinor = id.includes('minor') || id.includes('service');
      const isMotor = id.includes('mot') || id.includes('trunk');
      const isPrimary = id.includes('pri');
      const base = isMotor ? 1.2 : isPrimary ? .8 : isMinor ? .4 : .55;
      const width = isCase ? base * 2.2 : base;

      setP(id, 'line-color', isCase ? '#c9c6bb' : isMinor ? '#efece3' : '#f7f3ea');
      setP(id, 'line-width', [
        'interpolate', ['linear'], ['zoom'],
        5, width,
        10, width * 1.6,
        13, width * 3.1,
        15, width * 5.6
      ]);
      map.setLayerZoomRange(id, isMinor ? 12.5 : 5, 24);
    }
  });

  // National borders are drawn from assets/borders.js so the Bulgaria fill
  // and the dashed line share the exact same geometry. CARTO's own boundary
  // lines are hidden to avoid a second, slightly offset line.
  ['boundary_country_outline', 'boundary_country_inner'].forEach(id => {
    setL(id, 'visibility', 'none');
  });
  ['boundary_state', 'boundary_county'].forEach(id => {
    setP(id, 'line-color', '#8a6b52');
    setP(id, 'line-width', .5);
    setP(id, 'line-opacity', .16);
  });

  // CARTO's own country labels sit at country centroids and are hidden: for
  // Greece and Turkey those centroids fall outside the frame, and the four
  // edge labels used previously sometimes landed across a border. The custom
  // country-label layer below uses points that are inside each polygon.
  // City, road, POI and sea labels are also replaced by the editorial labels.
  map.getStyle().layers.forEach(layer => {
    if (layer.type !== 'symbol') return;
    setL(layer.id, 'visibility', 'none');
  });

  addWaterLabels();
  addCountryHighlight();
  addHillshade();
  addBorders();
  addPlaceLabels();
  addCountryLabels();

  // The basemap draws rivers beneath the country fill and the hillshade, where
  // the warm Bulgaria tint washes them out. Lift the lines above those but keep
  // them below the water fills, so no river line is ever drawn across a lake.
  // This has to run after the highlight and hillshade layers are added.
  if (map.getLayer('waterway') && map.getLayer('water')) {
    map.moveLayer('waterway', 'water');
  }
}

/* Bulgarian rivers and lakes carry almost no `name:en` in the basemap tiles:
   around Breznik only one named river in four has one, and the Konska has
   none. The Latin names therefore come from assets/water-names.js
   (scripts/build_water_names.py), which transliterates the OSM names with the
   official Bulgarian system and keeps the conventional English spellings for
   the big rivers. A `match` expression swaps the name in place, so the
   basemap still draws the line and the label follows it. */
function waterNameField(kind) {
  const table = (window.WATER_NAMES || {})[kind] || {};
  const branches = [];
  Object.keys(table).forEach(name => branches.push(name, table[name]));
  if (!branches.length) return ['get', 'name'];
  return ['match', ['get', 'name'], ...branches, ['get', 'name']];
}

function addWaterLabels() {
  // Names in Serbian or Macedonian Cyrillic that the Bulgarian rules cannot
  // romanise are listed here: hiding them is better than printing Cyrillic.
  const kept = ['!', ['in', ['get', 'name'],
    ['literal', (window.WATER_NAMES || {}).suppressed || []]]];

  // The basemap labels rivers with symbol-placement: line, which bends the
  // glyphs one by one along the meanders: on mountain rivers the name turns
  // into a serpentine and stops being readable. It is hidden and replaced by
  // one straight word per river, placed on an anchor point whose bearing comes
  // from the straightest stretch of the line (see refreshRiverLabels below).
  setL('waterway_label', 'visibility', 'none');

  if (!map.getSource('river-labels')) {
    map.addSource('river-labels', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }
  if (!map.getLayer('river-name-labels')) {
    const layer = {
      id: 'river-name-labels',
      type: 'symbol',
      source: 'river-labels',
      minzoom: RIVER_LABEL_MIN_ZOOM,
      layout: {
        'text-field': waterNameField('rivers'),
        'text-font': ['Montserrat Medium Italic'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 8.6, 11, 9.5, 13.4, 11],
        'text-letter-spacing': .04,
        'text-rotate': ['get', 'bearing'],
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'map',
        'text-offset': [0, -.45],
        'text-padding': 0,
        'text-max-width': 20,
        'symbol-placement': 'point'
      },
      paint: {
        'text-color': '#467f8c',
        'text-halo-color': '#f4eee2',
        'text-halo-width': 1.4,
        'text-opacity': .95
      }
    };
    // Keep the river names above roads, bridges and buildings (every basemap
    // line is added earlier) but below the other map labels.
    const nameBelow = ['watername_ocean', 'watername_lake', 'place_hamlet']
      .find(id => map.getLayer(id));
    if (nameBelow) map.addLayer(layer, nameBelow);
    else map.addLayer(layer);
  }

  if (map.getLayer('watername_lake')) {
    setL('watername_lake', 'visibility', 'visible');
    setL('watername_lake', 'text-field', waterNameField('lakes'));
    setL('watername_lake', 'text-font', ['Montserrat Medium Italic']);
    setL('watername_lake', 'text-size', ['interpolate', ['linear'], ['zoom'], 10, 8.5, 12, 9.6, 14, 11]);
    setP('watername_lake', 'text-color', '#3f7783');
    setP('watername_lake', 'text-halo-color', '#f4eee2');
    setP('watername_lake', 'text-halo-width', 1.4);
    setP('watername_lake', 'text-opacity', .95);
    map.setFilter('watername_lake', ['all',
      ['==', ['geometry-type'], 'Point'],
      ['has', 'name'],
      ['in', ['get', 'kind'], ['literal', ['lake', 'water', 'reservoir']]],
      kept
    ]);
    map.setLayerZoomRange('watername_lake', 10, 24);
  }
}

/* The river label layer draws points, so every name is one straight word.
   refreshRiverLabels reads the river lines already loaded in the basemap,
   groups them by name and, for each name visible in the frame, picks the
   straightest stretch at least as long as the word. The point at the middle of
   that stretch carries the bearing of the stretch, which the layer uses as
   text-rotate: the name stays straight but still follows the valley. */
let riverLabelKey = '';

function riverLabelSize(zoom) {
  const stops = [[9, 8.6], [11, 9.5], [13.4, 11]];
  if (zoom <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (zoom <= stops[i][0]) {
      const [z0, s0] = stops[i - 1];
      const [z1, s1] = stops[i];
      return s0 + (s1 - s0) * (zoom - z0) / (z1 - z0);
    }
  }
  return stops[stops.length - 1][1];
}

function riverLabelAnchor(name, segments, zoom) {
  const canvas = map.getCanvas();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const margin = 26;
  const word = Math.min(150, Math.max(34, name.length * riverLabelSize(zoom) * .58));
  const candidates = [];

  segments.forEach(line => {
    const pts = [];
    line.forEach(coord => {
      const p = map.project(coord);
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      const last = pts[pts.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1) return;
      pts.push(p);
    });
    if (pts.length < 2) return;

    const along = [0];
    for (let i = 1; i < pts.length; i++) {
      along.push(along[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = along[along.length - 1];
    if (total < 22) return;

    const span = Math.min(word, total * .92);
    if (span < 18) return;

    for (let i = 0; i < pts.length - 1 && along[i] <= total - span; i++) {
      let j = i + 1;
      while (j < pts.length - 1 && along[j] - along[i] < span) j++;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      const len = Math.hypot(dx, dy);
      if (len < 16) continue;

      // Straightness of the window: the largest distance of an intermediate
      // point from the chord between its ends.
      const ux = dx / len;
      const uy = dy / len;
      let dev = 0;
      for (let k = i + 1; k < j; k++) {
        const d = Math.abs((pts[k].x - pts[i].x) * uy - (pts[k].y - pts[i].y) * ux);
        if (d > dev) dev = d;
      }

      const mid = pts[Math.round((i + j) / 2)];
      if (mid.x < margin || mid.y < margin ||
          mid.x > w - margin || mid.y > h - margin) continue;
      candidates.push({ mid, dev, angle: Math.atan2(dy, dx) });
    }
  });

  if (!candidates.length) return null;

  let bestDev = Infinity;
  candidates.forEach(c => { if (c.dev < bestDev) bestDev = c.dev; });
  // Among the near-straightest windows prefer the one nearest the centre of
  // the frame, so the name does not jump to a random bend while panning.
  const cx = w / 2;
  const cy = h / 2;
  let best = null;
  let bestDistance = Infinity;
  candidates.forEach(c => {
    if (c.dev > bestDev + 2) return;
    const distance = Math.hypot(c.mid.x - cx, c.mid.y - cy);
    if (distance < bestDistance) { bestDistance = distance; best = c; }
  });
  if (!best) return null;

  // MapLibre rotates text clockwise; the wrap keeps the word upright and, for
  // a north-south river, reading from the bottom of the map upwards.
  const degrees = ((best.angle * 180 / Math.PI + 90) % 180 + 180) % 180 - 90;
  const lngLat = map.unproject(best.mid);
  return { lng: lngLat.lng, lat: lngLat.lat, bearing: degrees };
}

function refreshRiverLabels() {
  const source = map.getSource('river-labels');
  if (!source) return;

  const zoom = map.getZoom();
  const features = [];
  if (zoom >= RIVER_LABEL_MIN_ZOOM) {
    const suppressed = new Set((window.WATER_NAMES || {}).suppressed || []);
    const waterLayer = map.getStyle().layers.find(l => l.id === 'waterway');
    const vectorSource = (waterLayer && waterLayer.source) || 'protomaps';
    const vectorLayer = (waterLayer && waterLayer['source-layer']) || 'water';
    const groups = new Map();
    map.querySourceFeatures(vectorSource, {
      sourceLayer: vectorLayer,
      filter: ['all', ['==', ['get', 'kind'], 'river'], ['has', 'name']]
    }).forEach(f => {
      const name = f.properties.name;
      if (!name || suppressed.has(name)) return;
      const g = f.geometry;
      const lines = g.type === 'LineString' ? [g.coordinates]
        : g.type === 'MultiLineString' ? g.coordinates : [];
      if (!lines.length) return;
      if (!groups.has(name)) groups.set(name, []);
      lines.forEach(line => groups.get(name).push(line));
    });

    groups.forEach((segments, name) => {
      const anchor = riverLabelAnchor(name, segments, zoom);
      if (!anchor) return;
      features.push({
        type: 'Feature',
        properties: {
          name,
          bearing: Math.round(anchor.bearing * 10) / 10
        },
        geometry: { type: 'Point', coordinates: [anchor.lng, anchor.lat] }
      });
    });

    // OSM often carries both "Стряма" and "река Стряма" for the same river, so
    // two labels land a few dozen pixels apart and one cancels the other out.
    // When two names differ only by the "река" prefix or suffix and sit close
    // together, keep the shorter one.
    const baseName = s => s.toLowerCase()
      .replace(/^(река|р\.)\s*/, '')
      .replace(/\s+река$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const placed = [];
    features
      .map(f => ({ f, p: map.project(f.geometry.coordinates) }))
      .sort((a, b) => a.f.properties.name.length - b.f.properties.name.length)
      .forEach(({ f, p }) => {
        const duplicate = placed.some(k =>
          baseName(k.f.properties.name) === baseName(f.properties.name) &&
          Math.hypot(k.p.x - p.x, k.p.y - p.y) < 140);
        if (!duplicate) placed.push({ f, p });
      });
    features.length = 0;
    placed.forEach(({ f }) => features.push(f));
  }

  // setData re-renders the map, which fires idle again: bail out when nothing
  // changed instead of looping.
  const key = features.map(f => {
    const [lng, lat] = f.geometry.coordinates;
    return `${f.properties.name}|${lng.toFixed(5)}|${lat.toFixed(5)}|${f.properties.bearing}`;
  }).sort().join(';');
  if (key === riverLabelKey) return;
  riverLabelKey = key;
  source.setData({ type: 'FeatureCollection', features });
}

/* A warm, slightly darker fill makes Bulgaria stand out from its neighbours
   without breaking the paper palette. It sits above landcover but beneath
   water and roads, so it stays visible at every zoom. */
function addCountryHighlight() {
  // Loaded from assets/bulgaria-highlight.js so the map also works from file://,
  // where fetching a local GeoJSON file is blocked by the browser.
  if (!window.BULGARIA_HIGHLIGHT) return;
  if (!map.getSource('bulgaria-highlight')) {
    map.addSource('bulgaria-highlight', {
      type: 'geojson',
      data: window.BULGARIA_HIGHLIGHT
    });
  }
  if (!map.getLayer('country-highlight-bulgaria')) {
    const layer = {
      id: 'country-highlight-bulgaria',
      type: 'fill',
      source: 'bulgaria-highlight',
      filter: ['==', ['get', 'name'], 'Bulgaria'],
      paint: {
        'fill-color': '#ddc9a3',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, .9, 7.5, .82, 9, .56, 11, .38, 13, .28]
      }
    };
    if (map.getLayer('water')) map.addLayer(layer, 'water');
    else map.addLayer(layer);
  }
}

/* Soft, desaturated relief under the water, roads and labels. */
function addHillshade() {
  if (!map.getSource('hillshade')) {
    map.addSource('hillshade', {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 16,
      attribution: 'Hillshade: Esri, USGS, NGA, NASA and contributors'
    });
  }
  if (!map.getLayer('hillshade')) {
    const layer = {
      id: 'hillshade',
      type: 'raster',
      source: 'hillshade',
      paint: {
        'raster-opacity': .3,
        'raster-saturation': -1,
        'raster-contrast': .05,
        'raster-fade-duration': 0,
        'raster-resampling': 'linear'
      }
    };
    if (map.getLayer('water')) map.addLayer(layer, 'water');
    else map.addLayer(layer);
  }
}

/* Dashed national borders drawn from the same OSM geometry as the Bulgaria
   fill for the Bulgarian segments, so line and fill coincide exactly. */
function addBorders() {
  if (!window.BALKAN_BORDERS) return;
  if (!map.getSource('balkan-borders')) {
    map.addSource('balkan-borders', { type: 'geojson', data: window.BALKAN_BORDERS });
  }
  if (!map.getLayer('balkan-borders')) {
    const layer = {
      id: 'balkan-borders',
      type: 'line',
      source: 'balkan-borders',
      paint: {
        'line-color': '#5b3d2a',
        'line-width': 1.25,
        'line-opacity': .95,
        'line-dasharray': [4, 2]
      }
    };
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    if (firstSymbol) map.addLayer(layer, firstSymbol.id);
    else map.addLayer(layer);
  }
}

/* Administrative region labels and secondary cities, deliberately quieter
   than the story labels. Region labels hand over to city labels as the map
   zooms in. */
function addPlaceLabels() {
  if (!window.PLACE_LABELS) return;
  if (!map.getSource('place-labels')) {
    map.addSource('place-labels', { type: 'geojson', data: window.PLACE_LABELS });
  }
  if (!map.getLayer('city-major-dots')) {
    map.addLayer({
      id: 'city-major-dots',
      type: 'circle',
      source: 'place-labels',
      minzoom: 6.2,
      maxzoom: 9.4,
      filter: ['all', ['==', ['get', 'kind'], 'city'], ['==', ['get', 'rank'], 1]],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6.2, 1.2, 9, 2],
        'circle-color': 'rgba(32, 39, 38, .72)',
        'circle-stroke-color': '#f4eee2',
        'circle-stroke-width': 1,
        'circle-opacity': .85
      }
    });
  }
  if (!map.getLayer('city-major-labels')) {
    map.addLayer({
      id: 'city-major-labels',
      type: 'symbol',
      source: 'place-labels',
      minzoom: 6.2,
      maxzoom: 9.4,
      filter: ['all', ['==', ['get', 'kind'], 'city'], ['==', ['get', 'rank'], 1]],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Montserrat Medium'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6.2, 8.6, 9, 10.5],
        'text-anchor': 'top',
        'text-offset': [0, .6],
        'text-padding': 6
      },
      paint: {
        'text-color': 'rgba(32, 39, 38, .8)',
        'text-halo-color': '#f4eee2',
        'text-halo-width': 1.2,
        'text-opacity': .9
      }
    });
  }
  if (!map.getLayer('region-labels')) {
    map.addLayer({
      id: 'region-labels',
      type: 'symbol',
      source: 'place-labels',
      minzoom: 6.2,
      maxzoom: 8,
      filter: ['==', ['get', 'kind'], 'region'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Montserrat SemiBold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 6.2, 9, 8, 10.5, 9.6, 11.5],
        'text-letter-spacing': .16,
        'text-transform': 'uppercase',
        'text-padding': 8,
        'text-max-width': 8
      },
      paint: {
        'text-color': 'rgba(79, 85, 76, .52)',
        'text-halo-color': '#f4eee2',
        'text-halo-width': 1.2,
        'text-opacity': .9
      }
    });
  }
  if (!map.getLayer('city-dots')) {
    map.addLayer({
      id: 'city-dots',
      type: 'circle',
      source: 'place-labels',
      minzoom: 8.2,
      filter: ['==', ['get', 'kind'], 'city'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.2, 1.6, 11, 2.4, 13, 3],
        'circle-color': 'rgba(32, 39, 38, .72)',
        'circle-stroke-color': '#f4eee2',
        'circle-stroke-width': 1,
        'circle-opacity': .85
      }
    });
  }
  if (!map.getLayer('city-labels')) {
    map.addLayer({
      id: 'city-labels',
      type: 'symbol',
      source: 'place-labels',
      minzoom: 8.2,
      filter: ['==', ['get', 'kind'], 'city'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Montserrat Medium'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8.2, 9.5, 11, 11],
        'text-anchor': 'top',
        'text-offset': [0, .65],
        'text-padding': 6,
        'symbol-sort-key': ['get', 'rank']
      },
      paint: {
        'text-color': 'rgba(32, 39, 38, .72)',
        'text-halo-color': '#f4eee2',
        'text-halo-width': 1.2,
        'text-opacity': .9
      }
    });
  }
}

/* Country labels are placed at points that sit inside each Natural Earth
   polygon. This avoids the centroid problem (Greece and Turkey fall outside
   the initial frame) and keeps every name on the correct side of a border at
   every zoom and viewport size. CARTO's own country labels are hidden. */
function addCountryLabels() {
  if (typeof COUNTRY_LABELS === 'undefined') return;
  const data = {
    type: 'FeatureCollection',
    features: COUNTRY_LABELS.map(label => ({
      type: 'Feature',
      properties: { name: label.name, major: !!label.major, sea: !!label.sea },
      geometry: { type: 'Point', coordinates: [label.coords[1], label.coords[0]] }
    }))
  };

  if (!map.getSource('country-labels')) {
    map.addSource('country-labels', { type: 'geojson', data });
  }
  if (!map.getLayer('country-labels')) {
    map.addLayer({
      id: 'country-labels',
      type: 'symbol',
      source: 'country-labels',
      maxzoom: 8.6,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Montserrat SemiBold'],
        'text-size': ['interpolate', ['linear'], ['zoom'],
          5, ['case', ['get', 'major'], 13, 9.5],
          6.7, ['case', ['get', 'major'], 16, 11.5],
          8, ['case', ['get', 'major'], 18, 13.5]
        ],
        'text-letter-spacing': ['case', ['get', 'sea'], .14, .12],
        'text-transform': 'uppercase',
        'text-padding': 10,
        'text-max-width': 10,
        'symbol-sort-key': ['case', ['get', 'major'], 0, ['case', ['get', 'sea'], 2, 1]]
      },
      paint: {
        'text-color': ['case', ['get', 'sea'], '#4c7d87', '#4f554c'],
        'text-halo-color': ['case', ['get', 'sea'], '#cfe4e6', '#f4eee2'],
        'text-halo-width': 1.7,
        'text-halo-blur': .2,
        'text-opacity': .92
      }
    });
  }
}

/* ----------------------------------------------------------------- markers */
function pinElement(p) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pin-wrap';
  el.title = p.label[state.lang].name;
  el.setAttribute('aria-label', p.label[state.lang].name);
  el.innerHTML = `<span class="pin ${p.cat}" style="--s:${p.size}px">${GLYPHS[p.cat] || ''}</span>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopup(p);
  });
  return el;
}

function labelElement(p) {
  const wrap = document.createElement('div');
  wrap.className = 'place-label-wrap' + (p.zoomLabel ? ' zoom-label' : '');
  const span = document.createElement('span');
  span.className = `place-label ${p.cat} ${p.labelClass || ''}`;
  span.textContent = p.label[state.lang].name;
  wrap.appendChild(span);
  return { wrap, span };
}

function labelAnchor(dir) {
  if (dir === 'left') return { anchor: 'right', offset: [-10, 0] };
  if (dir === 'right') return { anchor: 'left', offset: [10, 0] };
  if (dir === 'top') return { anchor: 'bottom', offset: [0, -8] };
  return { anchor: 'top', offset: [0, 8] };
}

function addPlace(p) {
  let marker = null;
  if (!p.noPin) {
    const el = pinElement(p);
    marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([p.coords[1], p.coords[0]])
      .addTo(map);
  }

  const { wrap, span } = labelElement(p);
  const a = labelAnchor(p.dir);
  const labelMarker = new maplibregl.Marker({
    element: wrap,
    anchor: a.anchor,
    offset: a.offset
  }).setLngLat([p.coords[1], p.coords[0]]).addTo(map);

  markers.push({ p, marker, labelMarker, labelEl: span });

  // Secondary POIs start hidden: the first updateZoomClasses() after load
  // decides what belongs on screen at the current zoom.
  if (p.detail) {
    if (marker) {
      marker.getElement().classList.add('is-off');
      detailPinEls.push(marker.getElement());
    }
    wrap.classList.add('is-off');
    detailLabelEls.push(wrap);
  }
}

function updateZoomClasses() {
  if (!state.baseZoom) return;
  const z = map.getZoom();
  document.body.classList.toggle('zoom-labels', z >= state.baseZoom + 0.7);

  const showPins = z >= DETAIL_ZOOM;
  if (showPins !== pinsShown) {
    pinsShown = showPins;
    detailPinEls.forEach(el => el.classList.toggle('is-off', !showPins));
    // A detail popup left open while zooming out would hang over a place whose
    // pin is gone: close it instead.
    if (!showPins && state.open && currentPopup) {
      const open = PLACES.find(x => x.id === state.open.id);
      if (open && open.detail) currentPopup.remove();
    }
  }

  const showLabels = z >= DETAIL_LABEL_ZOOM;
  if (showLabels !== labelsShown) {
    labelsShown = showLabels;
    detailLabelEls.forEach(el => el.classList.toggle('is-off', !showLabels));
  }
}

function ensurePopupVisible(popup) {
  // Direct pin taps on a phone can put a popup half outside the viewport.
  // Nudge the map just enough to bring the whole popup back into view,
  // keeping it above the tour bar.
  if (window.innerWidth > 760 && window.innerHeight > 520) return;
  const el = popup.getElement();
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const margin = 10;
  const panelEl = document.querySelector('.panel');
  const panelRect = panelEl ? panelEl.getBoundingClientRect() : null;
  let topLimit = panelRect && panelEl.classList.contains('collapsed') && panelRect.top < 60
    ? Math.min(panelRect.bottom + 8, window.innerHeight * .4)
    : margin;
  const tour = document.querySelector('.tour');
  const bottomLimit = Math.min(
    window.innerHeight - margin,
    tour ? tour.getBoundingClientRect().top - 8 : window.innerHeight - margin
  );
  if (rect.height > bottomLimit - topLimit) topLimit = margin;

  let dx = 0;
  let dy = 0;
  if (rect.left < margin) dx = margin - rect.left;
  else if (rect.right > window.innerWidth - margin) {
    dx = (window.innerWidth - margin) - rect.right;
  }
  if (rect.top < topLimit) dy = topLimit - rect.top;
  else if (rect.bottom > bottomLimit) dy = bottomLimit - rect.bottom;

  if (!dx && !dy) return;
  map.panBy([-dx, -dy], { duration: 420 });
}

function openPopup(p) {
  if (currentPopup) currentPopup.remove();

  const pt = map.project([p.coords[1], p.coords[0]]);
  const below = pt.y < 280;
  const popup = new maplibregl.Popup({
    className: 'story-popup',
    closeButton: true,
    closeOnClick: true,
    anchor: below ? 'top' : 'bottom',
    offset: below ? 14 : 18,
    maxWidth: '320px'
  })
    .setLngLat([p.coords[1], p.coords[0]])
    .setHTML(popupHTML(p))
    .addTo(map);

  currentPopup = popup;
  state.open = { id: p.id };

  popup.on('close', () => {
    if (currentPopup === popup) {
      currentPopup = null;
      state.open = null;
    }
  });

  window.setTimeout(() => ensurePopupVisible(popup), 90);
  let fitAttempts = 0;
  const fitPopup = () => {
    if (currentPopup !== popup) return;
    const el = popup.getElement();
    const rect = el ? el.getBoundingClientRect() : null;
    if ((!rect || !rect.width || !rect.height) && fitAttempts++ < 8) {
      window.setTimeout(fitPopup, 70);
      return;
    }
    ensurePopupVisible(popup);
  };
  window.setTimeout(fitPopup, 220);

  // wait for MapLibre to place the popup before checking the legend
  window.setTimeout(() => {
    const popupEl = popup.getElement();
    if (!popupEl) return;
    const pRect = popupEl.getBoundingClientRect();
    const lRect = panel.getBoundingClientRect();
    if (rectsOverlap(pRect, lRect) && !panel.classList.contains('collapsed')) {
      setPanelCollapsed(true);
    }
  }, 160);
}

map.on('click', () => {
  if (currentPopup) currentPopup.remove();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && currentPopup) currentPopup.remove();
});

/* ---------------------------------------------------------- map text labels */
/* ------------------------------------------------------------------ locator */
const LOC = [[38.0, 18.0], [46.5, 30.5]]; // south/west, north/east

function merc(lat, lng) {
  return {
    x: (lng + 180) / 360,
    y: (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2
  };
}
const locNW = merc(LOC[1][0], LOC[0][1]);
const locSE = merc(LOC[0][0], LOC[1][1]);

function pct(lat, lng) {
  const p = merc(lat, lng);
  return {
    x: (p.x - locNW.x) / (locSE.x - locNW.x) * 100,
    y: (p.y - locNW.y) / (locSE.y - locNW.y) * 100
  };
}

function positionDot() {
  const d = pct(42.7417, 22.8981);
  const el = document.getElementById('locator-dot');
  el.style.left = d.x + '%';
  el.style.top = d.y + '%';
}

function updateLocator() {
  const b = map.getBounds();
  if (!b) return;
  const nw = merc(b.getNorth(), b.getWest());
  const se = merc(b.getSouth(), b.getEast());
  let left = (nw.x - locNW.x) / (locSE.x - locNW.x) * 100;
  let top = (nw.y - locNW.y) / (locSE.y - locNW.y) * 100;
  let width = (se.x - nw.x) / (locSE.x - locNW.x) * 100;
  let height = (se.y - nw.y) / (locSE.y - locNW.y) * 100;
  left = Math.max(0, Math.min(100, left));
  top = Math.max(0, Math.min(100, top));
  width = Math.max(1.2, Math.min(100 - left, width));
  height = Math.max(1.2, Math.min(100 - top, height));
  const r = document.getElementById('locator-rect');
  r.style.left = left + '%';
  r.style.top = top + '%';
  r.style.width = width + '%';
  r.style.height = height + '%';
}

document.getElementById('locator-map').addEventListener('click', (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  const px = locNW.x + x * (locSE.x - locNW.x);
  const py = locNW.y + y * (locSE.y - locNW.y);
  const lng = px * 360 - 180;
  const lat = (2 * Math.atan(Math.exp((1 - 2 * py) * Math.PI)) - Math.PI / 2) * 180 / Math.PI;
  map.easeTo({ center: [lng, lat], duration: 550 });
});

/* -------------------------------------------------------------------- panel */
const panel = document.querySelector('.panel');
const panelToggle = document.getElementById('panel-toggle');

function setPanelCollapsed(v) {
  panel.classList.toggle('collapsed', v);
  panelToggle.setAttribute('aria-expanded', String(!v));
  panelToggle.querySelector('.chev').textContent = v ? '+' : '−';
}
panelToggle.addEventListener('click', () => {
  setPanelCollapsed(!panel.classList.contains('collapsed'));
});
if (window.innerWidth < 760 || window.innerHeight < 680) setPanelCollapsed(true);

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/* --------------------------------------------------------------------- init */
positionDot();
// Every place gets a label; only the detail POIs are hidden until DETAIL_ZOOM.
PLACES.forEach(addPlace);


function applyLang() {
  const t = I18N[state.lang];
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (t[k] !== undefined) el.textContent = t[k];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const k = el.dataset.i18nHtml;
    if (t[k] !== undefined) el.innerHTML = t[k];
  });
  markers.forEach(({ p, labelEl }) => {
    labelEl.textContent = p.label[state.lang].name;
  });
  if (state.open && currentPopup) {
    const item = markers.find(x => x.p.id === state.open.id);
    if (item) currentPopup.setHTML(popupHTML(item.p));
  }
}
applyLang();

map.on('load', () => {
  applyEditorialStyle();
  map.fitBounds(ML_VIEW, { padding: overviewPadding(), duration: 0 });
  state.baseZoom = map.getZoom();
  map.setMinZoom(Math.max(4.8, state.baseZoom - 0.9));
  map.setMaxZoom(13.4);
  updateZoomClasses();
  updateLocator();
  refreshRiverLabels();
  document.getElementById('loader').classList.add('hidden');
});

map.on('move', updateLocator);
map.on('zoom', updateZoomClasses);
map.on('zoomend', updateZoomClasses);
map.on('idle', refreshRiverLabels);

window.addEventListener('resize', () => {
  map.resize();
  updateLocator();
});
window.addEventListener('orientationchange', () => {
  window.setTimeout(() => {
    map.resize();
    updateLocator();
  }, 250);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    map.resize();
    updateLocator();
  });
}
