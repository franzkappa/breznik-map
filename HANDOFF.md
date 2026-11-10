# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10 · sessione chiusa su `71f5a58` (spessore fiumi).
- Working tree: pulito, tranne `README.md`, modificato fuori dal task.
- Preview: GitHub Pages con `robots.txt` noindex; repo `franzkappa/breznik-map`.
- Locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato in questa sessione

- Spessore dei fiumi: il layer `waterway` non usa più una larghezza unica. La
  rampa di zoom resta una sola, ma ogni stop risolve la classe OSM `kind`, così
  il peso segue la rilevanza. Da z5 a z14: river 1,2→2,8 (prima 1→2,4), canal
  1→2,4, stream 0,7→1,65, drain/ditch (da z13) 0,5→1. Fiumi ~+15%, torrenti e
  fossi più sottili: l'affollamento cala da z12 in poi, dove tutti pesavano
  uguale. Il colore resta `#cfe4e6`, come mare e laghi: si è agito solo sullo
  spessore.
- Cache-bust di `map.js` in `index.html` incrementato a `20261110-29`.

## Funziona (invariato in questa sessione)

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
- Alcune etichette fluviali escono in cirillico perché in OSM quel `name:en`
  contiene testo cirillico: il filtro sul nome non lo intercetta.
- I nomi di fiumi e laghi compaiono solo dove OSM ha `name:en` (per esempio
  la Konska resta senza etichetta basemap); i laghi compaiono in pratica da
  z12.
- Le linee dei fiumi sono volutamente dello stesso colore del mare: per più
  leggibilità agire sul solo spessore, non sul colore.
- Tile CARTO/ArcGIS esterni: valutare il self-hosting per la produzione; offline
  possono non caricare, e allora la mappa degrada senza relief.
- QA su device reali iOS/Android non formalizzato; embed da provare su
  balcanicaucaso.org.
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
asset richiesti e sanity check. Ultimo esito: verde.

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

2026-11-10 — sessione chiusa su `71f5a58`, spessore fiumi per classe OSM.
