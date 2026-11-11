# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-11. Base: commit `21919a2`; pubblicato su `origin/main`.
- Working tree: `index.html`, `map.js`, `README.md`, `scripts/check.sh`
  modificati; nuovi `scripts/build_water_names.py` e `assets/water-names.js`.
- Repo `franzkappa/breznik-map`, preview GitHub Pages con `robots.txt` noindex;
  in locale `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato

Nomi di fiumi e laghi in latino, senza dipendere da `name:en` del basemap.

- **`scripts/build_water_names.py`**: interroga Overpass (Bulgaria + 30 km),
  costruisce `window.WATER_NAMES = {rivers, lakes, suppressed}`. Usa `name:en`
  se latino, altrimenti translitterazione ufficiale bulgara (Streamlined
  System) con override per i nomi dell'articolo e le grafie inglesi
  consolidate (Konska, Krassava, Danube, Struma, Maritsa, Nisava…). I nomi in
  cirillico serbo/macedone non romanizzabili finiscono in `suppressed` e non
  vengono mostrati (niente cirillico sulla mappa).
- **`assets/water-names.js`**: 748 nomi di fiumi, 752 di laghi, 49 soppressi,
  62 KB (19.5 KB gzip).
- **`map.js`**: `waterNameField()` costruisce una `match` sul `name`; i layer
  basemap `waterway_label` e `watername_lake` ricevono il nome latino. Filtri:
  `has name` + `kind == river` (o lake/water/reservoir) + lista soppressi.
  Aggiunti `text-max-angle: 120` e `symbol-spacing` interpolato (160 a z9,
  600 a z12, 750 a z13.4): senza, le etichette sui fiumi di montagna venivano
  quasi tutte scartate; lo spacing evita 3–4 ripetizioni dello stesso nome.
  I fiumi sono etichettati da z9 (sotto z9 CARTO non disegna linee d'acqua),
  i laghi da z10 ma CARTO genera i punti-nome dei laghi solo verso z13.
- **`index.html`**: script `assets/water-names.js?v=20261110-1`; cache-bust
  `map.js?v=20261110-32`. `tour.js` invariato.
- **`check.sh`**: nuovo script nella sintassi Python e nuovo asset nei file
  richiesti.
- Verifica a runtime (http://localhost:8000): console senza errori; a z9.5
  compaiono Maritsa, Stryama, Vacha…; a z12 Breznik ha Turska reka + Konska;
  a z13.4 Selska reka + Konska; laghi OK ("Lake Mandrensko"); embed a 390 px
  leggibile. Profilo CPU senza hotspot (la `match` è valutata nei worker).

## Riferimenti invariati

- POI secondari (colle Bardo, Milin Kamak, sorgente): pin da `DETAIL_ZOOM = 11`,
  etichette da `DETAIL_LABEL_ZOOM = 12`, popup chiuso sotto z11.
- 12 pin; Sofia solo etichetta, senza pin né popup. Sorgente del Bardo
  `cat:'water'`, pin pieno teal. Tour a 11 tappe; colle Bardo POI non-tappa.

## Prossimo task

1. Versione italiana della UI (non solo le label dei luoghi).
   - Accettazione: testi di UI, legenda, tour e popup in italiano; switch o build
     separata; nessuna regressione desktop/mobile; `check.sh` verde; console del
     browser senza errori.

## Problemi aperti

- `PLACES` ha già label e popup bilingui, ma `I18N` ha il solo blocco `en` e
  `state.lang` è fisso.
- I nomi traslitterati non sono stati riletti da un madrelingua: controllare in
  particolare le voci fuori dall'area di Breznik (es. `Селския Дол` →
  "Selskia Dol", dove l'ufficiale darebbe "Selskiya dol"). Le voci in
  `WATER_NAMES` sono generate: per correggerne una, aggiungere un override in
  `build_water_names.py` e rigenerare.
- Con `symbol-spacing` interpolato, a z9 alcune etichette possono comparire due
  volte sulla stessa asta fluviale (segmenti tagliati dai tile): è accettato.
- I ruscelli (`stream`) non sono etichettati: CARTO li disegna solo da z13 e
  resterebbero senza linea sotto. Se servono i tributari minori della Konska,
  valutare l'overlay GeoJSON (opzione B).
- I laghi hanno nome solo se CARTO genera il punto-nome (in pratica da z13); il
  bacino di Krassava è coperto dalla label del pin.
- Fiumi e laghi hanno nome solo dove OSM ha `name`; le etichette dipendono dai
  tile CARTO esterni (nessun self-hosting).
- `build_water_names.py` richiede Overpass: due query separate (quella unica
  risponde 502), cache in `/tmp`, retry sul mirror kumi.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.
- QA iOS/Android non formalizzata; embed da provare su balcanicaucaso.org.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` a mano (si rigenerano con gli script);
  `vendor/` (MapLibre 4.7.1); attribuzioni CARTO/OSM/Esri/USGS/NASA.
- `.docx`, `.xlsx` e altri file CIJI senza richiesta esplicita.

Vincoli:

- CARTO Positron + ArcGIS hillshade; niente basemap raster locale.
- Bulgaria fill e bordi dalla stessa geometria OSM semplificata.
- Sofia è solo etichetta, senza pin/popup. Nessuna dipendenza runtime oltre
  MapLibre. Label bilingui in `PLACES`; la UI è separata.
- I pallini delle città restano piccoli: non sono i pin dei POI Town.
- Incrementare il cache-bust di `map.js` (e di `tour.js` se cambia).

## Comando di verifica

`./scripts/check.sh` — sintassi Python, dipendenze, geolocalizzazione dei 13 POI,
locator, asset richiesti e sanity check. Ultimo esito: **ALL CHECKS PASS**. Non
valida la sintassi JS: dopo aver toccato i testi, ricaricare la pagina e guardare
la console.

## File chiave

- `index.html` — markup, CSS, dati `PLACES`, `I18N`, popup.
- `map.js` — MapLibre, layer, marker, soglie di zoom, locator, legenda, nomi
  latini di fiumi e laghi.
- `tour.js` — sequenza e controlli del tour; `scripts/` — asset generati;
  `verification/verify_geolocation.py` — audit POI.

## Workflow di sessione

- `/checkpoint`: aggiorna questo file, niente commit. `/handoff`: aggiorna il
  file, esegue `./scripts/check.sh`, propone un commit locale. `/publish`:
  verifica, committa e push su `origin/main`.

## Ultimo aggiornamento

2026-11-11 — nomi latini di fiumi e laghi (`water-names.js`), commit `21919a2`.
