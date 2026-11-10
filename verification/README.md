# Verifica di geolocalizzazione — mappa Breznik

**Data:** 9 novembre 2026  
**Oggetto:** studio della cartella `mappa_breznik` e controllo della geolocalizzazione dei punti d'interesse (POI) della mappa “Breznik and the water crisis”.  
**Esito sintetico:** 13 POI verificati; **1 errore di geolocalizzazione trovato e corretto** (sorgente del Bardo); dopo la correzione tutti i controlli automatici passano (`ALL CHECKS PASS`). Restano alcune osservazioni editoriali non bloccanti (quota del Bardo, etichette dei Paesi vicini, offset del pin di Breznik).

> **Stato attuale:** la mappa è passata alla basemap esterna **CARTO Positron + MapLibre**, con hillshade SRTM. Le coordinate dei POI sono rimaste identiche, compresa la sorgente del Bardo. La vecchia basemap `assets/basemap_embed.webp`, gli script di rendering locale e `carto-preview/` sono stati rimossi. Questo documento resta come verifica storica delle coordinate; il controllo del locator è ora statico e verifica gli hook dinamici usati da `map.js`.

---

## 1. Cosa contiene la cartella

| Elemento | Contenuto |
|---|---|
| `index.html` | Mappa MapLibre + CARTO pronta per iframe: 9 pin visibili + Sofia come etichetta, pannello legenda, loghi OBCT/CIJI, inset locator. |
| `README.md` | Descrizione della mappa, dei dati, dei file e delle istruzioni di rigenerazione. |
| `assets/` | `locator.webp`, loghi OBCT/CIJI navy. |
| `favicon.ico` | Icona 16×16, evita il 404 del favicon nella pagina. |
| `vendor/` | MapLibre GL JS 4.7.1 (CSS + JS). |
| `verification/` | Questo rapporto, lo script `verify_geolocation.py` e i tre GeoJSON minimi necessari alla verifica (acqua, fiumi, Stomana). |

La mappa contiene **13 POI** nell'array `PLACES` di `index.html`:

- **9 pin visibili:** Breznik, Krassava reservoir, Konska River, Pernik, Studena reservoir, Stomana steelworks, Pleven, Gorni Dabnik reservoir, Panagyurishte. **Sofia** resta come etichetta (capitale, punto di riferimento), senza pin né popup.
- **3 POI “detail”** (Bardo Hill, Milin Kamak, Bardo spring): hanno coordinate e popup ma non vengono disegnati come pin separati; sono descritti nel popup di Breznik. Sono stati verificati comunque.

Inoltre la mappa ha 6 etichette testuali di Paesi/mare (Bulgaria, Romania, Serbia, Greece, Turkey, Black Sea) e un inset locator con 7 etichette.

---

## 2. Metodo

1. Estratte le coordinate dall'array `PLACES` di `index.html`.
2. Confrontate con riferimenti indipendenti:
   - feature OpenStreetMap (nodi/way/relazioni) via Nominatim e API OSM;
   - layer OSM `embed_water.geojson` e `embed_rivers.geojson` già inclusi nella cartella;
   - poligono OSM `landuse=industrial` “Стомана Индъстри АД” (way 157511732);
   - seconda fonte per la sorgente del Bardo (pochivka.bg).
3. Verificato l'allineamento dell'immagine di base e del locator con le stesse coordinate.
4. Caricata la pagina in un browser (Chromium headless e browser integrato) per controllare che la mappa si carichi, che i pin siano 10 e che non ci siano errori in console.
5. Creato lo script ripetibile `verification/verify_geolocation.py` e rieseguito dopo la correzione.

**Soglie adottate:** 1,5 km per i centri abitati (il pin deve cadere nell'area urbana); 0,2 km per feature puntuali (vette, sorgente, fiume); contenimento nel poligono per invasi e stabilimento.

---

## 3. Risultati POI per POI

Comando: `python3 verification/verify_geolocation.py` (exit code 0).

| POI | Coordinate nella mappa | Riferimento indipendente | Metrica | Esito |
|---|---|---|---|---|
| Breznik | 42.74170, 22.89810 | OSM node 273488868 (place=town) — 42.7397669, 22.9103497 | 1,023 km | **PASS** (dentro l'abitato; vedi nota) |
| Krassava reservoir | 42.78700, 22.86100 | Poligono OSM “яз. Красава” in `embed_water` | interno al poligono | **PASS** |
| Bardo Hill | 42.72920, 22.91360 | OSM node 10548596962 (peak Св. Никола) — 42.7291881, 22.9138309 | 0,019 km | **PASS** |
| Milin Kamak | 42.72470, 22.92670 | OSM node 10549034289 (peak Милин камък) — 42.7246919, 22.9267420 | 0,004 km | **PASS** |
| Konska River | 42.66530, 22.91800 | OSM way 108016501 (waterway=river) — centro 42.6652765, 22.9180403; layer locale `embed_rivers` | 0,004 km dal centro OSM; 0,000 km dal layer locale | **PASS** |
| Bardo spring | 42.7313343, 22.9028954 *(corretto)* | OSM node 4386844742 “Желязна вода”; pochivka.bg 42.7313232, 22.9028282 | 0,000 km dal nodo OSM; 0,006 km da pochivka.bg | **PASS** (prima: 0,829 km → **FAIL**) |
| Sofia | 42.69770, 23.32190 | OSM relation 4283101 — 42.6977028, 23.3217359 | 0,013 km | **PASS** |
| Pernik | 42.60500, 23.03500 | OSM node 31058182 (place=city) — 42.6092185, 23.0309457 | 0,575 km | **PASS** (dentro la città) |
| Studena reservoir | 42.53090, 23.14970 | Poligono OSM “яз. Студена” in `embed_water` | interno al poligono | **PASS** |
| Stomana steelworks | 42.59320, 23.10490 | OSM way 157511732 (`landuse=industrial`, “Стомана Индъстри АД”) | interno al poligono | **PASS** |
| Pleven | 43.41700, 24.61600 | OSM node 31058183 (place=city) — 43.4090220, 24.6180123 | 0,902 km | **PASS** (dentro la città) |
| Gorni Dabnik reservoir | 43.36160, 24.30040 | Poligono OSM “яз. Горни Дъбник” in `embed_water` | interno al poligono | **PASS** |
| Panagyurishte | 42.50000, 24.18330 | OSM node 273488711 (place=town) — 42.5043065, 24.1888411 | 0,660 km | **PASS** (dentro l'abitato) |

**Nota Breznik:** il pin è 1,023 km a ovest del nodo OSM del centro città. Il reverse geocoding del punto restituisce comunque una via residenziale di Breznik, quindi il pin è dentro l'abitato; a scala nazionale è accettabile. Per un pin esattamente centrato usare 42.7397669, 22.9103497 (vedi §6).

---

## 4. Errore trovato e corretto: la sorgente del Bardo

**Prima:** `coords:[42.73645, 22.91028]` (index.html, riga 358).  
**Dopo:** `coords:[42.7313343, 22.9028954]` (index.html, riga 358).

Perché era sbagliata:

- Il punto precedente cade sul **versante nord** del colle, ai margini dell'abitato di Breznik, a quota ~743 m (SRTM 30 m): non è la località “Bardo/Leskov dol”.
- La sorgente ferruginosa “Желязна вода” (Zhelyaznata voda) è nella **parte occidentale** del colle Bardo, in località Leskov dol; il piano urbanistico comunale la indica a quota 830 m.
- OSM node 4386844742 “Желязна вода”: **42.7313343, 22.9028954** (natural=spring; descrizione: “Високо минерализирана. Годна за пиене само по лекарско предписание.”).
- pochivka.bg riporta **42.7313232, 22.9028282**, a pochi metri dal nodo OSM.
- Distanza tra il punto vecchio e quello corretto: **0,829 km**. Quota SRTM del punto corretto: ~807 m (compatibile con i 830 m della fonte comunale, considerando l'errore del modello SRTM).

Il popup non cambia: continua a descrivere la sorgente ferruginosa nota come “Zhelyaznata voda”. La mappa non usa la parola “thermal”; l'articolo parla di “thermal spring”, mentre le fonti descrivono una sorgente minerale fredda.

---

## 5. Allineamento del locator (la basemap locale non esiste più)

> I controlli su `basemap_embed.webp` sono storici e non sono più applicabili dopo il passaggio a CARTO. Il locator usa un'immagine di base senza pallino cotto: pallino e rettangolo sono elementi HTML posizionati da `map.js`.

| Controllo | Misura | Esito |
|---|---|---|
| Locator: immagine di base `assets/locator.webp` | 900x829 px | PASS |
| Locator: hook `#locator-dot` e `#locator-rect` | presenti in `index.html` | PASS |
| Locator: `positionDot()` e `updateLocator()` | presenti in `map.js` | PASS |

I controlli storici sulla vecchia `basemap_embed.webp` non sono più applicabili: la basemap è ora vettoriale e viene servita da CARTO. Il rettangolo e il pallino del locator sono dinamici e restano coerenti con il punto di Breznik.

**Caricamento pagina:** 9 pin visibili, 10 etichette, loader nascosto, nessun errore JavaScript e nessuna risposta HTTP ≥ 400, incluso il favicon (ora servito da `favicon.ico`). Verifica eseguita con Chrome headless e profilo nuovo via DevTools Protocol. I tre POI `detail` non sono disegnati per scelta (sono nel popup di Breznik).

---

## 6. Osservazioni secondarie (non bloccanti)

1. **Quota del Bardo: 929 m vs 923 m.**  
   La mappa e il README usano **929 m**. Le fonti principali dicono **923 m**: OSM node 10548596962 (`ele=923`), Wikipedia bg (“Св. Никола 923 м”), Wikimapia (“923 м”). SRTM 30 m dà 925–926 m; una pagina di itinerari (tripsjournal) riporta 929 m. La **coordinata è corretta** (19 m dal nodo OSM); la quota è un dettaglio editoriale da verificare. Non è stata modificata perché il README la dichiara esplicitamente come scelta basata su “public geographical sources”.

2. **Etichette dei Paesi sulla mappa principale.**  
   Le etichette decorative sono state corrette in questa versione:
   - Serbia: 43.35, 21.60;
   - Greece: 41.22, 23.00;
   - Turkey: 41.30, 26.80.  
   Le etichette del **locator** erano già corrette (Bulgaria, Romania, Serbia, Greece, Turkey, Black Sea, N. Macedonia verificate con i poligoni Natural Earth).

3. **Distanza “30 km west of Sofia”.**  
   Il testo della mappa (e l'articolo) dice 30 km. La distanza in linea d'aria è ~35,0 km dal pin di Breznik e ~33,9 km dal centro OSM; la distanza stradale è maggiore. È una formula dell'articolo, non un errore di geolocalizzazione del pin.

4. **Milin Kamak: pin sulla vetta omonima.**  
   Il pin coincide con la vetta OSM “Милин камък” (844 m), non con un poligono catastale della miniera. È un riferimento corretto per la località; il popup descrive correttamente concessione (~220 ha) e impianti previsti (47,75 ha). A scala nazionale è adeguato.

5. **README e POI `detail`.**  
   Il README dice che il popup di Breznik raggruppa “Bardo Hill, Milin Kamak, the Konska and the Bardo spring”. In realtà la Konska ha un pin separato (8 km a sud); il popup la cita, ma non è solo testuale. Piccola incoerenza documentale, non di geolocalizzazione.

6. **Basemap CARTO.**  
   La mappa usa ora MapLibre + CARTO Positron. L’hillshade SRTM è disattivato nella preview GitHub perché l’endpoint AWS non invia header CORS. Le coordinate dei POI sono rimaste identiche; il caricamento della basemap dipende dalla rete. Il prototipo separato `carto-preview/` non esiste più: è diventato il progetto principale.

---

## 7. Come riprodurre la verifica

```bash
cd "produzione editoriale/produzione editoriale/Hugo/mappa_breznik"
python3 verification/verify_geolocation.py
```

Output atteso: tabella con 13 POI + 1 controllo locator e la riga finale `ALL CHECKS PASS` (exit code 0).

Per il controllo visivo:

```bash
python3 -m http.server 8765
# aprire http://localhost:8765/index.html
```

---

## 8. Fonti principali

- OpenStreetMap / Nominatim:
  - Breznik: https://www.openstreetmap.org/node/273488868
  - Konska: https://www.openstreetmap.org/way/108016501
  - Sofia: https://www.openstreetmap.org/relation/4283101
  - Pernik: https://www.openstreetmap.org/node/31058182
  - Pleven: https://www.openstreetmap.org/node/31058183
  - Panagyurishte: https://www.openstreetmap.org/node/273488711
  - Св. Никола: https://www.openstreetmap.org/node/10548596962
  - Милин камък: https://www.openstreetmap.org/node/10549034289
  - Желязна вода: https://www.openstreetmap.org/node/4386844742
  - Stomana: https://www.openstreetmap.org/way/157511732
- Layer OSM inclusi: `verification/data/embed_water.geojson`, `verification/data/embed_rivers.geojson`.
- pochivka.bg, “Желязна вода (минерален извор)”: coordinate 42.7313232, 22.9028282.
- Wikipedia bg, “Брезник”: quota Св. Никола 923 m; sorgente “Желязна вода” nella località Бърдото.
- Wikimapia, “Възвишение Бърдото (Брезнишко бърдо)”: quota 923 m.
- Piano urbanistico comunale di Breznik: sorgente “Галерията” a quota 830 m in località Leskov dol, parte occidentale del colle Bardo.

---

## 9. File modificati / aggiunti

| File | Modifica |
|---|---|
| `index.html` | Riga 358: coordinate della sorgente del Bardo corrette da `42.73645,22.91028` a `42.7313343,22.9028954`. Aggiunto `<link rel="icon" type="image/x-icon" href="favicon.ico">` per evitare il 404 di `favicon.ico` in console. |
| `favicon.ico` | Nuovo: icona 16×16 (pallino teal), evita il 404 del favicon. |
| `verification/verify_geolocation.py` | Script di verifica ripetibile (13 POI + locator). |
| `data/reference/stomana_industry.geojson` | Nuovo poligono OSM dello stabilimento Stomana (way 157511732), usato per il controllo di contenimento. |
| `VERIFICA_geolocalizzazione.md` | Questo report. |
