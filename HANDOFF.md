# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10. Base: commit `ac52fc7`; lavoro locale **non pubblicato**.
- Working tree: solo i file del task (`index.html`, `HANDOFF.md`); nessuna
  modifica estranea.
- Repo `franzkappa/breznik-map`, preview GitHub Pages con `robots.txt` noindex;
  in locale `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato

Due soli interventi di testo in `index.html`; niente JS, CSS o asset.

- **Popup Stomana, solo `body.en`** corretto: "The Pernik steelworks **were** at
  the centre of the 2019–20 water scandal." (prima era un frammento senza
  verbo). Resto del popup e `body.it` invariati.
- **Corpo della legenda** (`p.deck` e `I18N.en.deck`): "A map of the places
  that show how, in Bulgaria, access to drinking water exposes fault lines in
  democracy and social inequality." Kicker, titolo, chiave e attribuzioni fermi.
- Nessun cache-bust da incrementare: `map.js` (`20261110-31`) e `tour.js`
  (`20261110-9`) non sono stati toccati.
- Verifica a runtime (http://localhost:8000): pagina caricata, console senza
  errori, deck su 3 righe, pannello legenda invariato in altezza.

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

- UI solo in inglese: `I18N` ha il solo blocco `en` e `state.lang` è fisso;
  label e popup sono già bilingui in `PLACES`.
- `body.it` del popup Stomana è una frase nominale ("L'acciaieria di Pernik al
  centro dello scandalo…"): allinearlo alla forma verbale inglese se si vuole
  parallelismo stretto.
- Fra z11 e z12 i POI secondari sono pallini senza nome (scelta voluta); sotto
  z11 non c'è più alcun testo che li elenchi: se serve, reintrodurre un riquadro.
- Le soglie dipendono dalla larghezza fissa delle etichette: se cambiano i testi,
  ricontrollare le sovrapposizioni a z12.
- Fiumi e laghi hanno nome solo dove OSM ha `name:en` (la Konska resta senza
  etichetta, i laghi da z12); a volte quel `name:en` è in cirillico.
- Tile CARTO/ArcGIS esterni: valutare self-hosting (offline manca il relief).
  QA iOS/Android non formalizzata; embed da provare su balcanicaucaso.org.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` (generati dagli script); `vendor/`
  (MapLibre 4.7.1); attribuzioni CARTO/OSM/Esri/USGS/NASA.
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
- `map.js` — MapLibre, layer, marker, soglie di zoom, locator, legenda.
- `tour.js` — sequenza e controlli del tour; `scripts/` — asset generati;
  `verification/verify_geolocation.py` — audit POI.

## Workflow di sessione

- `/checkpoint`: aggiorna questo file, niente commit. `/handoff`: aggiorna il
  file, esegue `./scripts/check.sh`, propone un commit locale. `/publish`:
  verifica, committa e push su `origin/main`.

## Ultimo aggiornamento

2026-11-10 — commit del task: `ee0715f`.
