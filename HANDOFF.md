# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", pensata per l'embed in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10
- Commit di riferimento: `097403c` — Refine mobile tour bar, legend and popup positioning
- Working tree: pulito (verificare con `git status --short`)
- Preview: GitHub Pages con `robots.txt` noindex; repo `franzkappa/breznik-map`
- Locale: `python3 -m http.server 8000` → http://localhost:8000

Funziona:

- MapLibre GL JS 4.7.1 + CARTO Positron vector basemap.
- Hillshade ArcGIS, confini nazionali, etichette oblast e città secondarie.
- Bulgaria highlight da poligono OSM; bordi allineati al fill.
- Locator inset, legenda, popup, tour guidato a 9 tappe.
- Layout mobile/iframe, `prefers-reduced-motion`, tastiera (frecce/Home).
- Coordinate POI verificate da `verification/`.

Da verificare / limiti:

- UI solo in inglese; le label dei luoghi sono già bilingui in `PLACES`.
- Tile CARTO/ArcGIS esterni: per la produzione valutare il self-hosting.
- QA su device reali iOS/Android non ancora formalizzato.
- Embed finale in balcanicaucaso.org da provare sulla pagina reale.

## Prossimo task suggerito

1. Versione italiana della UI (non solo le label dei luoghi).
   - Accettazione: testi di UI, legenda, tour e popup in italiano; scegliere
     switch o build separata; nessuna regressione desktop/mobile;
     `scripts/check.sh` verde.

## Backlog

- Self-hosting tile CARTO/ArcGIS per la produzione.
- Embed e QA su balcanicaucaso.org.
- Audit accessibilità (contrasto, focus, screen reader).
- Pulizia cache-bust e verifica GitHub Pages.

## File chiave

- `index.html` — markup, CSS, dati `PLACES`, popup.
- `map.js` — MapLibre, layer, marker, locator, legenda.
- `tour.js` — sequenza e controlli del tour.
- `scripts/build_map_assets.py` — locator + highlight Bulgaria.
- `scripts/build_borders.py` — confini nazionali.
- `scripts/build_labels.py` — etichette oblast e città.
- `verification/verify_geolocation.py` — audit coordinate POI.
- `assets/` — output generati (non editare a mano).
- `vendor/` — MapLibre 4.7.1 (non toccare).

## Comandi

- Servire: `python3 -m http.server 8000`
- Verifica completa: `./scripts/check.sh`
- Solo geolocalizzazione: `python3 verification/verify_geolocation.py`
- Rigenerare asset: `python3 scripts/build_map_assets.py`,
  `python3 scripts/build_borders.py`, `python3 scripts/build_labels.py`

## Decisioni / vincoli

- CARTO Positron + ArcGIS hillshade; niente basemap raster locale.
- Bulgaria fill e bordi dalla stessa geometria OSM semplificata.
- Sofia è solo label, senza pin/popup.
- Il popup Breznik raggruppa Bardo Hill, Milin Kamak, Konska, Bardo spring.
- Non introdurre dipendenze runtime oltre MapLibre.
- Le label bilingui stanno in `PLACES`; la UI è separata.

## Problemi noti

- Le tile esterne possono non caricare offline; la mappa deve degradare senza relief.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` (generati dagli script).
- `vendor/`.
- Attribuzioni CARTO/OSM/Esri/USGS/NASA.

## Ultimo aggiornamento

2026-11-10.
