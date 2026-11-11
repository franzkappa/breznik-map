# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare tramite iframe.

## Stato attuale (2026-11-11)

- Base pubblicata: commit `895ad2e` su `origin/main`; le modifiche di questo
  task sono ancora da committare.
- Working tree: `map.js`, `index.html`, `HANDOFF.md`.
- `screenshot-nomi-fiumi-illeggibili/` è materiale utente non tracciato: va
  lasciato fuori dai commit.
- Repo `franzkappa/breznik-map`; preview GitHub Pages con `robots.txt` noindex.
- In locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato

- **Nomi dei fiumi** (`map.js`): il layer CARTO `waterway_label`
  (`symbol-placement: line`, glifi piegati lungo le anse) è nascosto e
  sostituito dal source `river-labels` + layer `river-name-labels`.
- `refreshRiverLabels()` gira su `idle`: legge le linee già caricate dal
  basemap, le raggruppa per `name`, scarta `WATER_NAMES.suppressed` e sceglie
  per ogni fiume il tratto più retto lungo almeno quanto la parola. L'ancora è
  il centro del tratto, il bearing è l'angolo della corda.
- Layer `symbol-placement: point` con `text-rotate: ['get','bearing']` e
  `text-rotation-alignment: map`: la parola resta dritta ma orientata lungo la
  valle; `text-offset: [0,-.45]`, una etichetta per nome.
- Alias OSM vicini ("Стряма"/"река Стряма") deduplicati entro 140 px (resta il
  nome più corto); `text-padding: 0` evita collisioni tra etichette adiacenti.
- `RIVER_LABEL_MIN_ZOOM = 9`; sotto soglia il source viene svuotato.
- Cache-bust `map.js?v=20261111-34`.
- Verificato con Playwright: z9.4 (52 etichette dritte), Breznik 11.5/12.4,
  Stryama 11.8/12.9, z13.4, mobile 390 px; console pulita; `check.sh` verde.

## Prossimo task

Rifinire densità e posizionamento delle etichette se la redazione lo chiede
(vedi problemi aperti), oppure passare alla QA embed.

Criteri di accettazione:

- una parola unica e dritta, orientata al tratto più retto del fiume, tra z9 e
  z13.4;
- nessun duplicato evidente e nessuna sovrapposizione con pin o altri nomi;
- nessuna regressione desktop/mobile (390 px);
- console senza errori/warning e `check.sh` verde.

## Problemi aperti

- Densità: a z9.4 circa 50 etichette visibili; valutare con la redazione.
- Le parole lunghe vicine al bordo vengono tagliate (`symbol-avoid-edges` non
  aiuta: vale per i bordi tile, non per il canvas).
- L'ancora dipende dal centro del viewport: piccoli salti di posizione quando
  si panna su fiumi con più tratti retti equivalenti.
- Il bearing dipende dal source/layer CARTO (fallback su `waterway`): da
  ricontrollare se il basemap cambia.
- Alias con nomi molto diversi per lo stesso fiume non vengono deduplicati.
- Cifra abitanti Breznik: `5,426` nel file, `3,393` in `ae07874`; verificare
  con la redazione prima di cambiarla.
- UI italiana non ancora fatta: `I18N` ha solo `en` e `state.lang` è fisso.
- Nomi traslitterati non riletti da un madrelingua (es. "Selskia Dol").
- Ruscelli (`stream`) non etichettati; laghi solo dove CARTO genera il punto-nome.
- `build_water_names.py` richiede Overpass; `build_map_assets.py` richiede
  Montserrat e Natural Earth.
- QA iOS/Android non formalizzata; embed da provare su balcanicaucaso.org.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson`, `vendor/` a mano; attribuzioni CARTO/OSM/
  Esri/USGS/NASA.
- `screenshot-nomi-fiumi-illeggibili/`: materiale utente, non tracciato.
- `.docx`, `.xlsx` e altri file CIJI senza richiesta esplicita.
- Vincoli: CARTO Positron + ArcGIS hillshade; Sofia solo etichetta; pin
  secondari da `DETAIL_ZOOM = 11`, label da `DETAIL_LABEL_ZOOM = 12`.
- Incrementare il cache-bust di `map.js` (e `tour.js` se cambia).

## Comando di verifica

`./scripts/check.sh` — Python, dipendenze, 13 POI, locator, asset e sanity.
Non valida il JS: ricaricare la pagina e guardare la console.

Esito ultima esecuzione (2026-11-11): `ALL CHECKS PASS`.

## Data e commit

- Ultimo aggiornamento: 2026-11-11.
- Base: `895ad2e` (`origin/main`).
- Commit del task: `51596dd` (locale, non pubblicato).
