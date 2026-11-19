# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare tramite iframe. Serve in due lingue:
inglese nell'articolo EN, italiano in quello IT di balcanicaucaso.org.

## Stato attuale (2026-11-19)

- Base pubblicata: `da9e56a` su `origin/main`; la versione bilingue `b5e0628`
  è in pubblicazione.
- Working tree di questo task: `index.html`, `map.js`, `tour.js`,
  `scripts/check.sh`, `README.md`, `it/index.html` (nuovo), `HANDOFF.md`.
  **Non ancora committato.**
- `screenshot-nomi-fiumi-illeggibili/` è materiale utente non tracciato: va
  lasciato fuori dai commit.
- Repo `franzkappa/breznik-map`; preview GitHub Pages con `robots.txt` noindex.
- In locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato (i18n, opzione A)

- **Una sola mappa, due URL**: `/?lang=[it|en]`. `/it/index.html` è un
  redirect (`meta refresh`) a `../?lang=it`, così ogni embed resta a una riga
  e nessuna cartella duplica il codice.
- `index.html`: `langFromQuery()` accetta solo `it`, tutto il resto → `en`.
  Aggiunto il blocco `it` a `I18N` (eyebrow, titolo, deck, legenda, crediti,
  loader, etichette aria e tour). `COUNTRY_LABELS` ha ora `en`/`it` per nome
  (Macedonia del Nord, Bosnia Erzegovina, Ungheria, Moldavia, Ucraina,
  Grecia, Turchia, Mar Nero; forme allineate ai menu di balcanicaucaso.org).
- `map.js`: il layer `country-labels` usa `label[state.lang]`;
  `applyLang()` aggiorna anche `aria-label`, `title`, `alt` (chiavi
  `data-i18n-aria-label`, `data-i18n-title`, `data-i18n-alt`) e
  `document.title`; la chiave anti-loop di `refreshRiverLabels()` include la
  lingua.
- `tour.js`: "Luogo i di n: nome", aria dei pin "… — apri la scheda".
- Cache-bust: `map.js?v=20261119-35`, `tour.js?v=20261119-10`.
- `scripts/check.sh`: aggiunti `it/index.html`, `lang=it` e `it:{`.
- README: nuova sezione **Embed** con i due snippet e le note.

## Verificato (Playwright, server locale)

- `?lang=it`: titolo, h1, deck, legenda, fonte, loader, aria/label, `alt`
  inset, pulsanti tour, popup Breznik ("5.426 abitanti", testo IT), aria-live
  "Luogo 1 di 11", pin "Breznik — apri la scheda".
- `?lang=en` e senza parametro: identici a prima.
- `?lang=de`: fallback EN. `/it/` → `/?lang=it`.
- Mobile 340 e 390 px: nessun overflow, etichetta "Panoramica" nascosta come
  già accadeva con "Overview".
- Console: 0 errori, 0 warning. `./scripts/check.sh`: `ALL CHECKS PASS`.

## Prossimo task

1. La redazione inserisce i due embed nelle bozze (snippet in README, sezione
   **Embed**) e verifica su balcanicaucaso.org.
2. Se serve, commit e `/publish` di questo task (repo `franzkappa/breznik-map`,
   non di CIJI).

Criteri di accettazione embed:

- articolo EN → mappa in inglese; articolo IT → mappa in italiano;
- altezza corretta dentro `fusion_code`, nessuna barra di scorrimento;
- console pulita su entrambe le pagine ospiti.

## Problemi aperti

- **Testi italiani dei POI e di `I18N` non riletti dalla redazione**: sono
  prerequisito della pubblicazione IT. Confrontare con le forme usate dal
  sito; la cifra abitanti Breznik (`5,426` / `5.426`) resta da confermare.
- Lingua anche nei widget MapLibre di default (NavigationControl, attributo
  compatto): restano "Zoom in/out" se esposti; non visibili sulle etichette.
- Densità etichette fiumi (~50 a z9.4) e parole tagliate ai bordi: invariate.
- L'ancora delle etichette fiumi dipende dal centro del viewport.
- Il bearing dei fiumi dipende dal layer CARTO `waterway`: ricontrollare se il
  basemap cambia.
- Alias con nomi molto diversi per lo stesso fiume non deduplicati.
- Ruscelli (`stream`) non etichettati; laghi solo dove CARTO genera il punto.
- Nomi traslitterati non riletti da un madrelingua (es. "Selskia Dol").
- `build_water_names.py` richiede Overpass; `build_map_assets.py` richiede
  Montserrat e Natural Earth.
- QA iOS/Android non formalizzata.

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
Non valida il JS: ricaricare la pagina e guardare la console (in entrambe le
lingue: `/?lang=en` e `/?lang=it`).

Esito ultima esecuzione (2026-11-19): `ALL CHECKS PASS`.

## Data e commit

- Ultimo aggiornamento: 2026-11-19.
- Base: `da9e56a` (`origin/main`).
- Commit del task: `b5e0628` (locale, da pubblicare).
