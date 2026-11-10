# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10. Base: commit `ae07874`; lavoro locale non pubblicato.
- Working tree: solo i file del task (`HANDOFF.md`, `README.md`, `index.html`,
  `tour.js`); nessuna modifica estranea.
- Repo `franzkappa/breznik-map`, preview GitHub Pages con `robots.txt` noindex;
  in locale `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato

- **Colle Bardo fuori dal tour**: 11 tappe (Breznik → Milin Kamak → sorgente del
  Bardo → Krassava → Konska → Pernik → Studena → Stomana → Panagyurishte →
  Pleven → Gorni Dabnik). Resta POI con pin (z11), etichetta (z12) e popup: un
  clic sul pin apre il popup e azzera il contatore (`– / 11`), non essendo tappa.
- **Tre testi di popup ridotti** (solo `body` in `PLACES`, EN e IT allineati):
  Colle Bardo senza la frase sull'arsenico; Pernik senza permessi Stomana e
  accusa a Neno Dimov; sorgente del Bardo riscritta ("The iron-rich spring in
  the Bardo locality. Arsenic has also been detected here…").
- Cache-bust: `tour.js` `20261110-9`; `map.js` invariato (`20261110-31`).
- `README.md` allineato: 11 tappe, Bardo Hill POI non-tappa, contatore `1 / 11`.

## Riferimenti invariati

- POI secondari (colle Bardo, Milin Kamak, sorgente): pin da
  `DETAIL_ZOOM = 11`, etichette da `DETAIL_LABEL_ZOOM = 12`, popup chiuso sotto
  z11. A z11.5 le etichette (56–91 px) coprivano i pin, distanti 35–55 px.
- 12 pin; Sofia solo etichetta, senza pin né popup. Sorgente del Bardo
  `cat:'water'`, pin pieno teal.

## Prossimo task

1. Versione italiana della UI (non solo le label dei luoghi).
   - Accettazione: testi di UI, legenda, tour e popup in italiano; switch o
     build separata; nessuna regressione desktop/mobile; `check.sh` verde;
     console del browser senza errori.

## Problemi aperti

- UI solo in inglese: `I18N` ha il solo blocco `en` e `state.lang` è fisso;
  label e popup sono già bilingui in `PLACES`.
- Fra z11 e z12 i POI secondari sono pallini senza nome (scelta voluta); sotto
  z11 non c'è più alcun testo che li elenchi, perché il `note` di Breznik è
  stato rimosso: se serve, reintrodurre un riquadro breve.
- Le soglie dipendono dalla larghezza fissa delle etichette: se cambiano i
  testi, ricontrollare le sovrapposizioni a z12.
- Fiumi e laghi hanno nome solo dove OSM ha `name:en` (la Konska resta senza
  etichetta; i laghi da z12); alcune etichette escono in cirillico perché quel
  `name:en` è in cirillico. Linee fluviali come il mare: agire sullo spessore.
- Tile CARTO/ArcGIS esterni: valutare il self-hosting; offline manca il relief.
  QA su device reali iOS/Android non formalizzato; embed da provare su
  balcanicaucaso.org.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` (generati dagli script); `vendor/`
  (MapLibre 4.7.1); attribuzioni CARTO/OSM/Esri/USGS/NASA.
- `.docx`, `.xlsx` e altri file CIJI senza richiesta esplicita.

Vincoli:

- CARTO Positron + ArcGIS hillshade; niente basemap raster locale.
- Bulgaria fill e bordi dalla stessa geometria OSM semplificata.
- Sofia è solo etichetta, senza pin/popup.
- Nessuna dipendenza runtime oltre MapLibre.
- Label bilingui in `PLACES`; la UI è separata.
- I pallini delle città restano piccoli: non sono i pin dei POI Town.
- Incrementare il cache-bust di `map.js` (e di `tour.js` se cambia).

## Comando di verifica

`./scripts/check.sh` — sintassi Python, dipendenze, geolocalizzazione dei 13 POI,
locator, asset richiesti e sanity check. Ultimo esito: **verde**. Non valida la
sintassi JS: dopo aver toccato i testi, ricaricare la pagina e guardare la
console.

## File chiave

- `index.html` — markup, CSS, dati `PLACES`, `I18N`, popup.
- `map.js` — MapLibre, layer, marker, soglie di zoom, locator, legenda.
- `tour.js` — sequenza e controlli del tour; `scripts/` — asset generati;
  `verification/verify_geolocation.py` — audit POI.

## Workflow di sessione

- `/checkpoint`: aggiorna questo file, niente commit. `/handoff`: aggiorna il
  file, esegue `./scripts/check.sh`, propone un commit locale. `/publish`:
  verifica, committa e push su `origin/main`.

## Ultimo aggiornamento

2026-11-10 — commit del task: `a13b51a`.
