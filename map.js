/* CARTO vector basemap + MapLibre, isolated prototype.
   Data and the popup HTML live in the inline script in index.html. */

const CARTO_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
// MapLibre order: west, south / east, north
const ML_VIEW = [[21.35, 41.20], [28.05, 44.50]];
const ML_MAX = [[18.00, 38.00], [31.00, 46.50]];

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
  setP('waterway', 'line-color', '#6ea6b0');
  setP('waterway', 'line-width', 1.1);

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
        setP(id, 'line-color', '#d8b98f');
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

      setP(id, 'line-color', isCase ? '#fbf5e9' : '#c9975c');
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

  // national borders: same grey dashed language as the local basemap
  setP('boundary_country_outline', 'line-color', '#f4eee2');
  setP('boundary_country_outline', 'line-width', 2.8);
  setP('boundary_country_inner', 'line-color', '#4a463c');
  setP('boundary_country_inner', 'line-width', 1.25);
  setP('boundary_country_inner', 'line-opacity', .92);
  setP('boundary_country_inner', 'line-dasharray', [4, 2]);
  ['boundary_state', 'boundary_county'].forEach(id => {
    setP(id, 'line-color', '#8a8375');
    setP(id, 'line-width', .55);
    setP(id, 'line-opacity', .25);
  });

  // Keep CARTO's own typographic label layers only for countries and the sea.
  // City, road and POI labels are replaced by the editorial labels on the map.
  map.getStyle().layers.forEach(layer => {
    if (layer.type !== 'symbol') return;
    const keep = ['place_country_1', 'place_country_2', 'watername_sea'].includes(layer.id);
    if (!keep) setL(layer.id, 'visibility', 'none');
  });

  ['place_country_1', 'place_country_2'].forEach(id => {
    setL(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 4, 10, 6, 13, 8, 16, 11, 20]);
    setL(id, 'text-letter-spacing', .09);
    setL(id, 'text-transform', 'uppercase');
    setL(id, 'text-padding', 8);
    setP(id, 'text-color', '#4f554c');
    setP(id, 'text-halo-color', '#f4eee2');
    setP(id, 'text-halo-width', 1.7);
    setP(id, 'text-halo-blur', .2);
    setP(id, 'text-opacity', .92);
  });

  setL('watername_sea', 'text-letter-spacing', .12);
  setP('watername_sea', 'text-color', 'rgba(76, 125, 135, .9)');
  setP('watername_sea', 'text-halo-color', '#cfe4e6');
  setP('watername_sea', 'text-halo-width', 1.2);

  addEdgeLabels();
}

/* CARTO's country labels sit at country centroids, so Romania, Serbia,
   Greece and Turkey fall outside the initial frame. These four edge labels
   use the same CARTO font stack and are hidden once zoomed in. */
function addEdgeLabels() {
  const data = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Romania' }, geometry: { type: 'Point', coordinates: [25.20, 44.45] } },
      { type: 'Feature', properties: { name: 'Serbia' }, geometry: { type: 'Point', coordinates: [21.75, 42.70] } },
      { type: 'Feature', properties: { name: 'Greece' }, geometry: { type: 'Point', coordinates: [22.70, 41.25] } },
      { type: 'Feature', properties: { name: 'Turkey' }, geometry: { type: 'Point', coordinates: [26.20, 41.55] } },
      { type: 'Feature', properties: { name: 'Black Sea' }, geometry: { type: 'Point', coordinates: [27.75, 43.00] } }
    ]
  };

  if (!map.getSource('edge-country-labels')) {
    map.addSource('edge-country-labels', { type: 'geojson', data });
  }
  if (!map.getLayer('edge-country-labels')) {
    map.addLayer({
      id: 'edge-country-labels',
      type: 'symbol',
      source: 'edge-country-labels',
      maxzoom: 8.2,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Montserrat SemiBold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 6.7, 12, 8, 14],
        'text-letter-spacing': .12,
        'text-transform': 'uppercase',
        'text-padding': 6
      },
      paint: {
        'text-color': '#4f554c',
        'text-halo-color': '#f4eee2',
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
  const el = pinElement(p);
  const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat([p.coords[1], p.coords[0]])
    .addTo(map);

  const { wrap, span } = labelElement(p);
  const a = labelAnchor(p.dir);
  const labelMarker = new maplibregl.Marker({
    element: wrap,
    anchor: a.anchor,
    offset: a.offset
  }).setLngLat([p.coords[1], p.coords[0]]).addTo(map);

  markers.push({ p, marker, labelMarker, labelEl: span });
}

function updateZoomClasses() {
  if (!state.baseZoom) return;
  document.body.classList.toggle('zoom-labels', map.getZoom() >= state.baseZoom + 0.7);
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
PLACES.filter(p => !p.detail).forEach(addPlace);


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
  map.fitBounds(ML_VIEW, { padding: 0, duration: 0 });
  state.baseZoom = map.getZoom();
  map.setMinZoom(Math.max(4.8, state.baseZoom - 0.4));
  map.setMaxZoom(13.4);
  updateZoomClasses();
  updateLocator();
  document.getElementById('loader').classList.add('hidden');
});

map.on('move', updateLocator);
map.on('zoom', updateZoomClasses);
map.on('zoomend', updateZoomClasses);

window.addEventListener('resize', () => {
  map.resize();
  updateLocator();
});
