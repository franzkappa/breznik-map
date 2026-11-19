# HANDOFF — mappa_breznik

## Obiettivo

Mappa interattiva della crisi idrica di Breznik per l'articolo CIJI/OBCT
"Democracy Running Dry", da embeddare tramite iframe. Serve in due lingue:
inglese nell'articolo EN, italiano in quello IT di balcanicaucaso.org.

## Stato attuale (2026-11-19)

- **Pubblicato**: `c3c27ed` su `origin/main` (task bilingue `b5e0628` +
  HANDOFF). Deploy GitHub Pages verificato in produzione.
- **Rilettura redazionale IT completata** (2026-11-19): 13 popup, `deck` e
  riga `source` in `I18N.it`. Modifiche solo testuali in `index.html`, nessun
  tocco a `map.js`/`tour.js` → cache-bust invariato
  (`map.js?v=20261119-35`, `tour.js?v=20261119-10`).
- Embed pronto per le due bozze Fusion/Avada: istruzioni nel README, sezione
  **Embed** (incluso il formato `[fusion_code]` in base64).
- `screenshot-nomi-fiumi-illeggibili/` è materiale utente non tracciato: va
  lasciato fuori dai commit.
- Repo `franzkappa/breznik-map`; preview GitHub Pages con `robots.txt` noindex.
- In locale: `python3 -m http.server 8000` → http://localhost:8000

## Cosa è cambiato (rilettura IT)

- **Bacini**: "bacino idrico di Krassava / Studena / Gorni Dabnik" in
  `label`, `kicker` e `title`.
- **Collina del Bardo**: da "Colle Bardo"; `stat` 929 m, testo con
  "San Nikola" e "giacimento di oro e argento di Milin Kamak".
- **Stomana**: kicker "Industria e istituzioni", stat "Autorizzazioni
  concesse nonostante gli avvertimenti", "mancanza di controllo pubblico".
- **Pernik / Pleven**: stat "Circa 100.000 persone colpite" / "Più di
  100mila persone colpite" (allineate anche a `label.it.sub`).
- **Konska / Studena**: sottotitoli etichetta allineati al popup
  ("Si prosciuga ogni estate", "Bacino idrico di Studena").
- **Gorni Dabnik**: kicker "La promessa", stat "Proposta di realizzazione
  di un impianto di depurazione" (lungo: valutare accorciamento).
- **`I18N.it`**: nuovo `deck` ("…metta in luce le fratture della democrazia
  e le disuguaglianze sociali."); `source` con "Inset map" al posto di
  "Insetto"; "Hillshade" lasciato invariato; voci della legenda "Bacini
  idrici" e "Siti minerari" (da "Acqua" e "Miniera").
- Cifra abitanti Breznik confermata `5.426 abitanti`.

## Verificato

- `./scripts/check.sh`: `ALL CHECKS PASS` (2026-11-19).
- In browser locale `?lang=it`: titolo, deck, legenda ("Bacini idrici",
  "Siti minerari"), riga fonte, crediti "Inset map", etichette pin ("Bacino idrico di Krassava — apri la scheda"),
  popup Krassava con testo nuovo, tour "Luogo 4 di 11".
- `?lang=en`: titolo e pagina invariati.
- **Non verificato**: console JS del browser (il pannello non era
  disponibile in sessione); ricontrollare prima di considerare chiuso il task.

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

## Verificato (Playwright)

In locale:

- `?lang=it`: titolo, h1, deck, legenda, fonte, loader, aria/label, `alt`
  inset, pulsanti tour, popup Breznik ("5.426 abitanti", testo IT), aria-live
  "Luogo 1 di 11", pin "Breznik — apri la scheda".
- `?lang=en` e senza parametro: identici a prima.
- `?lang=de`: fallback EN. `/it/` → `/?lang=it`.
- Mobile 340 e 390 px: nessun overflow, etichetta "Panoramica" nascosta come
  già accadeva con "Overview".
- Console: 0 errori, 0 warning. `./scripts/check.sh`: `ALL CHECKS PASS`.

In produzione (`github.io`, dopo il deploy di `c3c27ed`):

- `…/breznik-map/` → EN, `map.js?v=20261119-35`; `…/breznik-map/it/` → 200 e
  redirect a `/?lang=it`; legenda e tour tradotti; console pulita.

## Prossimo task

1. Controllo console in `/?lang=it` e `/?lang=en` con Playwright/DOM (in
   questa sessione non è stato possibile), poi embed nelle bozze Fusion.
2. La redazione inserisce i due embed nelle bozze Fusion (snippet in README,
   sezione **Embed**) e verifica la resa dentro l'articolo.

Criteri di accettazione embed:

- articolo EN → mappa in inglese; articolo IT → mappa in italiano;
- altezza corretta dentro `fusion_code`, nessuna barra di scorrimento;
- console pulita su entrambe le pagine ospiti.

## Problemi aperti

- **Rilettura IT fatta** (2026-11-19): da decidere con la redazione se
  accorciare lo `stat` di Gorni Dabnik e se uniformare "monte Bardo" (popup
  Breznik) con "Collina del Bardo".
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
- Commit pubblicati: `b5e0628` (bilingue), `c3c27ed` (HANDOFF).
