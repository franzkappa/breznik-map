# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10
- Commit di riferimento: `9249d36` (pin Town, fiumi, nomi di fiumi e laghi).
  `README.md` resta modificato fuori dal task.
- Working tree: vedi `git status --short`.
- Preview: GitHub Pages con `robots.txt` noindex; repo `franzkappa/breznik-map`.
- Locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato in questa sessione

- Pin dei POI `cat:'town'` (Breznik, Pernik, Pleven) portati a 16 px, come i
  pin Water; i pallini delle città secondarie restano piccoli come prima.
- Fiumi, laghi e mare hanno lo stesso colore `#cfe4e6` (fill `water` e linee
  `waterway`). Le linee stanno sopra fill Bulgaria/hillshade ma sotto i fill
  d'acqua, quindi non attraversano i laghi.
- Nomi di fiumi e laghi dal basemap in corsivo (Montserrat Medium Italic) da
  z9/z10, solo per le feature con `name:en`.
- Cache-bust di `map.js` in `index.html` incrementato a `20261110-28`.

Funziona:

- MapLibre GL JS 4.7.1 + CARTO Positron, hillshade ArcGIS, confini nazionali,
  etichette oblast e città, highlight Bulgaria.
- Locator inset, legenda, popup, tour guidato a 9 tappe, layout mobile/iframe,
  `prefers-reduced-motion`, tastiera (frecce/Home).
- Coordinate POI verificate da `verification/`.

## Prossimo task

1. Versione italiana della UI (non solo le label dei luoghi).
   - Accettazione: testi di UI, legenda, tour e popup in italiano; switch o
     build separata; nessuna regressione desktop/mobile; `scripts/check.sh`
     verde.

## Problemi aperti

- UI solo in inglese; le label dei luoghi sono già bilingui in `PLACES`.
- I nomi di fiumi e laghi compaiono solo dove OSM ha `name:en` (per esempio
  la Konska resta senza etichetta basemap); i laghi compaiono in pratica da
  z12.
- Le linee dei fiumi sono volutamente dello stesso colore del mare: per più
  leggibilità agire sul solo spessore, non sul colore.
- Tile CARTO/ArcGIS esterni: valutare il self-hosting per la produzione.
- QA su device reali iOS/Android non formalizzato; embed da provare su
  balcanicaucaso.org.
- Le tile esterne possono non caricare offline: degradare senza relief.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` (generati dagli script).
- `vendor/` (MapLibre 4.7.1).
- Attribuzioni CARTO/OSM/Esri/USGS/NASA.
- `README.md` ha modifiche estranee al task (workflow di sessione): non
  committarle con questo task.

Vincoli:

- CARTO Positron + ArcGIS hillshade; niente basemap raster locale.
- Bulgaria fill e bordi dalla stessa geometria OSM semplificata.
- Sofia è solo label, senza pin/popup.
- Non introdurre dipendenze runtime oltre MapLibre.
- Le label bilingui stanno in `PLACES`; la UI è separata.
- I pallini delle città restano piccoli: non sono i pin dei POI Town.
- Incrementare il cache-bust di `map.js` a ogni modifica.

## Comando di verifica

`./scripts/check.sh` — sintassi Python, dipendenze, geolocalizzazione POI,
asset richiesti e sanity check.
Servire in locale: `python3 -m http.server 8000`.

## File chiave

- `index.html` — markup, CSS, dati `PLACES`, popup.
- `map.js` — MapLibre, layer, marker, locator, legenda.
- `tour.js` — sequenza e controlli del tour.
- `scripts/build_map_assets.py`, `scripts/build_borders.py`,
  `scripts/build_labels.py` — generazione asset.
- `verification/verify_geolocation.py` — audit coordinate POI.

## Workflow di sessione

- `/checkpoint`: aggiorna questo file, niente commit.
- `/handoff`: aggiorna questo file, esegue `./scripts/check.sh`, propone un
  commit locale.
- `/publish`: verifica, committa e push su `origin/main`.

## Ultimo aggiornamento

2026-11-10 — commit di riferimento `9249d36`.
