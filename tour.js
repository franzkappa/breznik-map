/* Guided tour for tour.html.
   The previous/next buttons fly from one pin to the next in story order and
   open the matching popup. The map, places and popup helpers come from
   map.js and the inline script in tour.html, which load before this file. */

(function () {
  'use strict';

  // Story order and the zoom each stop deserves. Only places that are shown
  // as pins on the map and have popup content are included.
  const STOPS = [
    { id: 'breznik', zoom: 11.3 },
    { id: 'krassava', zoom: 12.2 },
    { id: 'konska', zoom: 11.4 },
    { id: 'pernik', zoom: 9.7 },
    { id: 'studena', zoom: 10.6 },
    { id: 'stomana', zoom: 10.8 },
    { id: 'panagyurishte', zoom: 9.6 },
    { id: 'pleven', zoom: 9.5 },
    { id: 'gorni', zoom: 10.4 }
  ];

  const stops = STOPS
    .map(stop => {
      const place = PLACES.find(p => p.id === stop.id);
      return place ? Object.assign({}, stop, { place }) : null;
    })
    .filter(Boolean);

  const prevBtn = document.getElementById('tour-prev');
  const nextBtn = document.getElementById('tour-next');
  const countEl = document.getElementById('tour-count');
  const totalEl = document.getElementById('tour-total');
  const liveEl = document.getElementById('tour-live');
  const countPos = countEl.querySelector('b');

  let index = -1;
  let sequence = 0;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  totalEl.textContent = String(stops.length);

  function setActiveMarker() {
    const activeId = index >= 0 ? stops[index].place.id : null;
    markers.forEach(({ p, marker }) => {
      if (!marker) return;
      marker.getElement().classList.toggle('is-tour', p.id === activeId);
    });
  }

  function updateUI() {
    countPos.textContent = index >= 0 ? String(index + 1) : '–';
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= stops.length - 1;
    setActiveMarker();

    if (index >= 0) {
      const place = stops[index].place;
      liveEl.textContent = 'Place ' + (index + 1) + ' of ' + stops.length +
        ': ' + place.label.en.name;
    } else {
      liveEl.textContent = '';
    }
  }

  function closeOpenPopup() {
    if (typeof currentPopup !== 'undefined' && currentPopup) currentPopup.remove();
  }

  function goTo(i) {
    if (i < 0 || i >= stops.length) return;

    index = i;
    updateUI();

    const stop = stops[i];
    const center = [stop.place.coords[1], stop.place.coords[0]];
    const token = ++sequence;

    closeOpenPopup();

    if (reduceMotion) {
      map.jumpTo({ center: center, zoom: stop.zoom });
      openPopup(stop.place);
      return;
    }

    let opened = false;
    const open = () => {
      if (opened || token !== sequence) return;
      opened = true;
      openPopup(stop.place);
    };

    map.once('moveend', open);
    map.flyTo({
      center: center,
      zoom: stop.zoom,
      offset: [0, 44],       // keep the pin slightly below centre, so the popup fits above
      duration: 1350,
      curve: 1.35,
      essential: true
    });

    // fallback in case flyTo ends without a moveend event (same view)
    window.setTimeout(open, 1650);
  }

  prevBtn.addEventListener('click', () => {
    if (index > 0) goTo(index - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (index < stops.length - 1) goTo(index + 1);
  });

  // Keep the counter in sync when a pin is opened directly on the map.
  // MapLibre labels every marker "Map marker", so restore the place name.
  markers.forEach(({ p, marker }) => {
    if (!marker) return;
    const el = marker.getElement();
    el.setAttribute('aria-label', p.label.en.name + ' — open popup');
    el.addEventListener('click', () => {
      const i = stops.findIndex(stop => stop.id === p.id);
      if (i < 0) return;
      index = i;
      updateUI();
    });
  });

  // Arrow keys work everywhere except while the map canvas is focused:
  // there MapLibre already uses them to pan the map.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (el && el.closest && el.closest('.maplibregl-canvas-container')) return;

    if (e.key === 'ArrowRight' && index < stops.length - 1) {
      e.preventDefault();
      goTo(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      goTo(index - 1);
    }
  });

  updateUI();
})();
