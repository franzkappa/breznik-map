# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare in un articolo tramite iframe.

## Stato attuale

- Data: 2026-11-10.
- Working tree: pulito; il lavoro della sessione è nei commit `da8d0d4` e
  successivi, più la riscrittura del testo del POI Breznik (commit locale, non
  pubblicato).
- Repo `franzkappa/breznik-map`, preview GitHub Pages con `robots.txt` noindex.
- Locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato

- **Testo del POI Breznik riscritto** (solo `index.html`, dati `PLACES`):
  sottotitolo `3,393 residents` / `3.393 abitanti` (era 5,426), `body` nuovo in
  inglese e italiano (50 km da Sofia, razionamento dal 18 novembre 2024
  all'aprile 2026, contaminazione estate 2025) e **rimosso il campo `note`**
  con il riquadro "Around Breznik". Kicker e titolo invariati. Nessuna modifica a
  `map.js`/`tour.js`, quindi cache-bust invariato.
- **POI secondari con due soglie.** Colle Bardo, Milin Kamak e sorgente del
  Bardo hanno pin ed etichetta propri: pin da `DETAIL_ZOOM = 11`, etichette da
  `DETAIL_LABEL_ZOOM = 12` (`map.js`). Sotto z11 restano nascosti e non c'è più
  un riquadro nel popup di Breznik che li spieghi (il vecchio `note` è stato
  rimosso con la riscrittura del testo). Soglie misurate: a z11.5 le
  etichette (56–91 px) si sovrappongono ai pin, distanti 35–55 px; i soli pin
  non si toccano già a z10.5. Il popup di un POI secondario si chiude sotto z11.
- **Tour a 12 tappe**: Breznik → colle Bardo → Milin Kamak → sorgente → Krassava
  → Konska → Pernik → Studena → Stomana → Panagyurishte → Pleven → Gorni
  Dabnik; le tappe nuove a z13.4, il massimo della mappa.
- **Sorgente del Bardo uniformata a Water**: `cat:'water'`, pin pieno teal
  invece del cerchio bianco; rimossi gli hook `spring` ormai morti.
- Cache-bust: `map.js` `20261110-31`, `tour.js` `20261110-8`.
- `README.md` allineato alla mappa: 12 pin, 12 tappe, soglie z11/z12, elenco
  delle località e esempio del contatore.

## Prossimo task

1. Versione italiana della UI (non solo le label dei luoghi).
   - Accettazione: testi di UI, legenda, tour e popup in italiano; switch o
     build separata; nessuna regressione desktop/mobile; `check.sh` verde.

## Problemi aperti

- UI solo in inglese: `I18N` ha il solo blocco `en` e `state.lang` è fisso;
  label e popup sono già bilingui in `PLACES`.
- Fra z11 e z12 i POI secondari sono senza nome (pallini non etichettati):
  scelta voluta, non un bug. Da quando il `note` di Breznik è stato rimosso,
  sotto z11 non c'è più alcun testo che li elenchi: se serve, reintrodurre un
  riquadro breve o un'etichetta di riepilogo.
- Le soglie dipendono dalla larghezza fissa delle etichette: se cambiano i
  testi, ricontrollare le sovrapposizioni a z12.
- Alcune etichette fluviali escono in cirillico perché in OSM quel `name:en`
  contiene testo cirillico: il filtro sul nome non lo intercetta.
- Nomi di fiumi e laghi solo dove OSM ha `name:en` (la Konska resta senza
  etichetta basemap); i laghi compaiono in pratica da z12.
- Le linee dei fiumi sono volutamente dello stesso colore del mare: agire sul
  solo spessore.
- Tile CARTO/ArcGIS esterni: valutare il self-hosting; offline manca il relief.
- QA su device reali iOS/Android non formalizzato; embed da provare su
  balcanicaucaso.org.
- `build_map_assets.py` richiede Montserrat in `~/Library/Fonts` e scarica
  Natural Earth al primo run.

## Cosa non toccare

- `assets/*.js`, `assets/*.geojson` (generati dagli script); `vendor/`
  (MapLibre 4.7.1); attribuzioni CARTO/OSM/Esri/USGS/NASA.

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
locator, asset richiesti e sanity check. Ultimo esito: verde.

Non valida la sintassi JS: dopo aver toccato i testi, ricaricare e guardare la console.

## File chiave

- `index.html` — markup, CSS, dati `PLACES`, `I18N`, popup.
- `map.js` — MapLibre, layer, marker, soglie di zoom, locator, legenda.
- `tour.js` — sequenza e controlli del tour.
- `scripts/` — generazione asset; `verification/verify_geolocation.py` — audit POI.

## Workflow di sessione

- `/checkpoint`: aggiorna questo file, niente commit.
- `/handoff`: aggiorna questo file, esegue `./scripts/check.sh`, propone un
  commit locale.
- `/publish`: verifica, committa e push su `origin/main`.

## Ultimo aggiornamento

2026-11-10 — testo del POI Breznik riscritto (3.393 abitanti, razionamento
2024–2026, contaminazione 2025) e rimosso il campo `note` "Around Breznik".
Partenza da `3f527e9`; commit precedenti: `da8d0d4`; commit del task: vedi
`git log`.
