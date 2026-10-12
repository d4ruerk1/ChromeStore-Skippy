# Skippy

Estensione per Chrome, Brave, Edge, Firefox e in generale per browser
basati su Chromium o su Gecko, che salta automaticamente sigla/intro,
recap e titoli di coda su Netflix, Amazon Prime Video, Disney+, Crunchyroll
e Paramount+, e può avanzare da solo all'episodio successivo,
indipendentemente dalla lingua impostata sull'interfaccia.

Non è un'estensione ufficiale né affiliata a nessuna di queste piattaforme:
è uno strumento indipendente basato sull'osservazione della struttura
tecnica (non testuale, dove possibile) dei pulsanti di skip.

## Come funziona (e perché regge il cambio di lingua)

Il livello di affidabilità del riconoscimento varia da piattaforma a
piattaforma, a seconda di quanto sia documentabile pubblicamente un
attributo tecnico stabile per il pulsante di salto:

- **Netflix e Prime Video** espongono i pulsanti "salta" tramite attributi
  tecnici interni (ad esempio `data-uia="player-skip-intro"` su Netflix, o
  la classe `atvwebplayersdk-skipelement-button` su Prime Video) che restano
  identici qualunque sia la lingua scelta nel proprio account: solo
  l'etichetta visibile ("Salta sigla", "Skip Intro", ecc.) cambia, non
  l'attributo con cui Skippy riconosce il pulsante.
- **Disney+** usa in modo analogo la classe `skip__button` per qualunque
  pulsante di salto (confermata da più script/estensioni indipendenti, ma
  senza una fonte ufficiale altrettanto solida quanto per Netflix/Prime
  Video: vedi i commenti in `src/disney.js`).
- **Crunchyroll e Paramount+** non espongono, per quanto risulta
  pubblicamente, un attributo tecnico stabile equivalente: qui Skippy si
  affida principalmente al riconoscimento multilingua descritto sotto.

Come rete di sicurezza (principale su Crunchyroll e Paramount+, di riserva
su Netflix/Prime Video/Disney+ nel caso quelle piattaforme modificassero i
propri attributi), l'estensione riconosce il pulsante anche dal testo (o
aria-label) confrontandolo con un elenco di frasi tipo "salta sigla" in una
ventina di lingue, incluse le diciture per titoli di coda/finale più comuni
sui contenuti animati.

## Installazione (modalità sviluppatore)

### Chrome, Brave, Edge e altri browser basati su Chromium

1. Scarica ed estrai questa cartella in una posizione stabile del tuo
   computer (non cancellarla dopo l'installazione: il browser la legge da
   lì ogni volta che si avvia).
2. Apri il browser e vai alla pagina delle estensioni (ad esempio
   `brave://extensions`, `chrome://extensions` o `edge://extensions`).
3. Attiva **Modalità sviluppatore** (interruttore in alto a destra).
4. Clicca **Carica estensione non pacchettizzata** ("Load unpacked").
5. Seleziona la cartella `skippy` (quella che contiene il file
   `manifest.json`).
6. L'estensione comparirà nella barra degli strumenti: apri Netflix, Prime
   Video, Disney+, Crunchyroll o Paramount+, avvia un episodio e la sigla
   verrà saltata da sola.

Perché "non pacchettizzata": l'estensione non è pubblicata su uno store
ufficiale, quindi il browser richiede la modalità sviluppatore per
caricarla da una cartella locale. È il metodo standard per le estensioni
personali non distribuite tramite store.

### Firefox

Il manifest include già la sezione `browser_specific_settings.gecko`
(id univoco, versione minima 140 e dichiarazione
`data_collection_permissions: none`, richiesta da Mozilla dal 3 novembre
2025 per qualunque nuova estensione): il codice è verificato con il
validatore ufficiale `web-ext lint` senza errori né avvisi, quindi è pronto
sia per il caricamento temporaneo sia per la sottomissione ad
[addons.mozilla.org](https://addons.mozilla.org) (AMO).

Per provarla subito, senza pubblicarla:

1. Scarica ed estrai questa cartella in una posizione stabile del tuo
   computer.
2. Apri Firefox e vai su `about:debugging#/runtime/this-firefox`.
3. Clicca **Carica componente aggiuntivo temporaneo...** ("Load Temporary
   Add-on...").
4. Seleziona il file `manifest.json` dentro la cartella `skippy`.
5. L'estensione comparirà nella barra degli strumenti, attiva fino alla
   chiusura di Firefox: alla riapertura del browser va ricaricata ripetendo
   questi passaggi (limite di Firefox per i componenti aggiuntivi
   temporanei, non specifico di Skippy).

Per un'installazione permanente (che sopravviva al riavvio del browser),
Firefox richiede che il pacchetto sia firmato da Mozilla: va sottomesso su
AMO (anche in modalità "solo per te", senza pubblicazione pubblica) oppure
installato su Firefox Developer Edition/Nightly con la verifica della firma
disattivata nelle impostazioni avanzate.

## Impostazioni

Cliccando sull'icona di Skippy si apre un pannello con due interruttori in
tutto, validi per tutte le piattaforme supportate (Netflix, Prime Video,
Disney+, Crunchyroll e Paramount+), entrambi **attivi di default
all'installazione**:

- **Salta sigla / intro / recap**: copre sigla/intro, riassunto/recap e
  titoli di coda su tutte le piattaforme.
- **Episodio successivo automatico**: avanza da solo all'episodio
  successivo quando la riproduzione è realmente vicina alla fine.

Chi preferisce disattivare una delle due funzioni può farlo dal popup in
qualunque momento; la scelta viene ricordata anche dopo aver chiuso e
riaperto il browser.

Non ci sono più interruttori separati per singola piattaforma: le due
impostazioni sopra valgono ovunque, per tenere il popup semplice. Dalla
v1.6.0 non c'è più nemmeno un interruttore generale separato per spegnere
tutta l'estensione con un solo comando: chi vuole disattivare
temporaneamente una funzione può spegnere il relativo interruttore qui
sopra.

Il testo del popup si adatta da solo alla lingua del browser (italiano,
inglese, francese, spagnolo, russo, arabo, hindi o tedesco, con l'inglese
come ricaduta per le lingue non supportate): vedi la sezione
"Localizzazione del popup" più sotto.

Dopo aver installato l'estensione o cambiato un'impostazione, ricarica la
pagina della piattaforma interessata perché sia applicata alla
riproduzione in corso.

## Struttura del progetto

```
skippy/
├── manifest.json        Manifest v3: nome, icone, permessi, content script
├── popup.html            Interfaccia del popup (impostazioni + donazioni)
├── popup.js              Logica del popup: legge/scrive le impostazioni
├── icons/
│   ├── icon.svg          Sorgente vettoriale dell'icona
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png       Esportate dal sorgente vettoriale, non pixelate
├── _locales/             Traduzioni del popup (chrome.i18n), una cartella
│   │                     per lingua: it, en, fr, es, ru, ar, hi, de
│   └── <lingua>/messages.json
└── src/
    ├── core.js            Impostazioni condivise + loop di auto-skip comune
    ├── i18n.js             Localizzazione del testo del popup (chrome.i18n)
    ├── netflix.js         Configurazione (selettori) specifica di Netflix
    ├── amazon.js          Configurazione (selettori) specifica di Prime Video
    ├── disney.js          Configurazione (selettori) specifica di Disney+
    ├── crunchyroll.js     Configurazione specifica di Crunchyroll
    └── paramount.js       Configurazione specifica di Paramount+
```

Tutte le piattaforme condividono la stessa logica di funzionamento (carica
le impostazioni, osserva i cambiamenti, prova i selettori tecnici in ordine
di priorità, ripiega sulla rete di sicurezza multilingua): questa logica
vive una sola volta in `src/core.js`, mentre ogni file di piattaforma si
limita a descrivere la propria configurazione (dove si trova il player,
quali selettori usare per ciascuna azione, e su Crunchyroll/Paramount+
quanto spesso controllare il fallback testuale).

## Note tecniche su efficienza e robustezza

- Su Netflix il content script viene caricato solo sulle pagine
  `netflix.com/watch/...` (non su home, ricerca, account, ecc.), quindi
  non gira affatto altrove.
- Su Amazon/Prime Video, dato che i domini Amazon servono sia il negozio
  sia i video, lo script prima verifica con una singola ricerca per id
  (`#dv-web-player`, il contenitore del player confermato anche dal
  codice sorgente di Firefox) se sei in riproduzione: se non lo sei, il
  controllo si ferma lì senza fare altro, così l'estensione resta
  leggera anche mentre navighi il resto del sito.
- Sia su Netflix sia su Prime Video, i pulsanti vengono cercati solo
  dentro il contenitore del player (non in tutta la pagina), per
  evitare di intercettare per errore altri elementi con testo simile.
- Su Disney+, Crunchyroll e Paramount+ non è stato possibile individuare,
  con la stessa certezza di Netflix/Prime Video, un id o una classe del
  contenitore del player confermata da una fonte solida: qui la "guardia"
  di economia si limita a verificare che in pagina ci sia un elemento
  `<video>` in riproduzione, e solo in quel caso si cercano i pulsanti (su
  tutta la pagina, non solo dentro un contenitore ristretto). Il costo
  resta comunque minimo quando non si sta guardando nulla.
- Proprio perché su Crunchyroll e Paramount+ la ricerca non è ristretta a
  un contenitore player, per il pulsante di salto NON viene usato nessun
  selettore tecnico "a indovinare" (es. basato su attributi generici
  contenenti la parola "skip"): rischierebbe di intercettare altri elementi
  della pagina, come i link di accessibilità "salta al contenuto" presenti
  su moltissimi siti. Ci si affida invece al riconoscimento testuale
  multilingua di `core.js`, che richiede frasi complete ("skip intro",
  "salta sigla", ecc.) e quindi resta comunque prudente.
- Il player di Crunchyroll può essere incorporato in un iframe ospitato su
  `static.crunchyroll.com` (dominio comunque coperto dal pattern
  `*://*.crunchyroll.com/*`): il relativo content script è registrato con
  `"all_frames": true` in `manifest.json`, così da girare anche dentro
  quell'iframe e non solo nella pagina principale.

## Calibrazione delle soglie temporali (v1.4.0)

Rispetto alle versioni precedenti, il meccanismo di rilevamento e i tempi di
attivazione sono stati rivisti per correggere due problemi opposti: lo skip
di sigla/recap/titoli di coda che poteva arrivare percettibilmente in
ritardo, e l'avanzamento automatico all'episodio successivo che poteva
scattare troppo presto rispetto alla fine reale dell'episodio.

- **Rilevamento guidato dagli eventi, non solo a intervallo fisso.** Prima
  ogni pulsante veniva cercato solo ogni 400 ms (fino a 2000 ms per il
  riconoscimento testuale multilingua quando usato come ripiego). Ora un
  `MutationObserver` osserva il contenitore del player (o l'intero
  documento finché il contenitore non esiste ancora) e fa scattare un
  controllo non appena il DOM cambia in modo rilevante; l'intervallo fisso
  resta solo come rete di sicurezza economica, abbassato a 250 ms. Su
  Crunchyroll e Paramount+, dove il riconoscimento testuale è il meccanismo
  principale e non un ripiego, l'intervallo massimo tra due scansioni è
  stato abbassato a 150 ms.
- **Corretto un caso reale in cui uno skip poteva risultare "invisibile".**
  Il controllo di visibilità si basava solo su `offsetParent`, che per
  specifica del DOM è sempre `null` per gli elementi in `position: fixed`
  (una tecnica comune per gli overlay dei player a schermo intero):
  indipendentemente dai tempi, un pulsante di skip in quello stato non
  veniva mai riconosciuto come cliccabile. Ora si usa `getClientRects()`,
  affidabile anche in quel caso, insieme a un controllo di stile calcolato
  (display/visibility/opacità).
- **L'avanzamento all'episodio successivo non scatta più al primo
  avvistamento.** A differenza degli skip di sigla/recap/titoli di coda, che
  vanno eseguiti il prima possibile, il pulsante "episodio successivo" deve
  restare visibile con continuità per una breve finestra di conferma (600 ms
  se la durata del video è nota, 1200 ms se non lo è ancora) e, quando la
  durata è nota, la riproduzione deve trovarsi realmente vicina alla fine
  (soglia calcolata come il 15% della durata totale, con un minimo di 60 e
  un massimo di 240 secondi di tempo rimanente, per adattarsi sia a episodi
  brevi sia a episodi lunghi). Dopo un click, un breve raffreddamento di 4
  secondi evita ricliccate ravvicinate se il sito non rimuove subito il
  pulsante durante la transizione. Questo riguarda in particolare
  Crunchyroll e Paramount+, dove il selettore dell'episodio successivo cerca
  nell'intera pagina (non solo dentro il player) e potrebbe altrimenti
  intercettare un elemento con lo stesso pattern di attributi presente ben
  prima della fine reale dell'episodio (es. un suggerimento in una lista
  laterale).

Tutte queste soglie sono parametri di configurazione in cima a
`skippyCreateAutoSkipLoop` (`src/core.js`) e possono essere ulteriormente
affinate per singola piattaforma passando gli stessi nomi di opzione dal
relativo file in `src/` (es. `nextEpisodeConfirmMs`, `fallbackIntervalMs`).

## Correzioni v1.5.0

- **Impostazioni semplificate.** Le vecchie impostazioni per singola
  piattaforma (`netflixSkipIntro`, `primeSkipIntro`, ecc.) sono state
  sostituite da due sole chiavi condivise, `skipIntro` e `autoNext`, usate
  da tutti i content script e riflesse nel popup semplificato. Le vecchie
  preferenze salvate restano nello storage ma non vengono più lette: dopo
  l'aggiornamento tutte le piattaforme ripartono dai nuovi valori di
  default (skip attivo, auto-next disattivato).
- **Corretto un loop di click ripetuti su Prime Video.** Il pulsante di
  salto (`.atvwebplayersdk-skipelement-button`) può restare tecnicamente
  "visibile" per una breve finestra dopo il click, prima che il sito lo
  nasconda o lo rimuova davvero. Senza un raffreddamento, lo stesso
  elemento veniva ritrovato e cliccato di nuovo al giro immediatamente
  successivo, con il risultato percepito di un video che continuava a
  saltare sempre allo stesso punto. Ora, dopo un click su un'azione di
  skip, lo stesso identico elemento DOM non viene ricliccato per
  `skipActionCooldownMs` (default 1200 ms): vedi il commento su questo
  parametro in `src/core.js`.
- **Click sintetico più affidabile.** `skippyClick` ora invia anche una
  sequenza pointerdown/mousedown/pointerup/mouseup oltre a `el.click()`,
  per i pulsanti realizzati come div/span con `role="button"` che alcuni
  player gestiscono tramite eventi puntatore invece che tramite il solo
  evento "click": prima potevano risultare individuati correttamente ma
  senza alcun effetto reale, percepiti come spezzoni "non rilevati".
- **Corretto il rallentamento del video durante la riproduzione.** In
  `skippyFindFallbackButton` (il riconoscimento testuale multilingua,
  meccanismo principale su Crunchyroll e Paramount+) l'ordine dei controlli
  era invertito: veniva calcolata per prima la visibilità di OGNI
  bottone/link della pagina (un'operazione che costringe il browser a un
  ricalcolo sincrono del layout), e solo dopo si guardava il testo. Ora il
  testo (economico) viene controllato per primo, e il ricalcolo del layout
  avviene solo sui pochi elementi il cui testo assomiglia già a un
  pulsante di salto: la riduzione del carico è più marcata proprio su
  Crunchyroll e Paramount+, dove questa scansione gira fino a una volta
  ogni 150 ms su tutta la pagina.

## Correzioni v1.6.0

- **Corretto un loop residuo su Prime Video.** Il raffreddamento per
  riferimento DOM introdotto in v1.5.0 (`skipActionCooldownMs`) non copriva
  un caso concreto: se il player ricrea il pulsante di salto come nodo DOM
  nuovo ad ogni rendering (stessa classe e stessa posizione a schermo, ma un
  oggetto diverso in memoria), quel controllo non lo riconosce come "già
  cliccato" e lo lascia ricliccare subito, riproducendo lo stesso loop
  percepito ("il video continua a saltare sempre allo stesso punto"). Ora il
  ciclo osserva anche la posizione di riproduzione (`video.currentTime`): se
  resta ferma entro pochi secondi dal punto dell'ultimo click per più click
  di fila, si presume un loop in corso (indipendentemente dall'identità
  dell'elemento) e i click di skip vengono sospesi per qualche secondo
  invece di continuare a raffica. Vedi il commento su
  `skipLoopPositionEpsilon` in `src/core.js` per i dettagli e le soglie
  configurabili.
- **Rimosso l'interruttore generale dell'estensione.** Il popup non ha più
  un comando unico per accendere/spegnere Skippy ovunque: restano i due
  interruttori per funzione (`skipIntro`, `autoNext`). Chi aveva
  installazioni precedenti con l'interruttore generale su "spento" non
  resta bloccato: quella chiave non viene più letta da nessun content
  script, quindi l'estensione riparte semplicemente dalle impostazioni di
  `skipIntro`/`autoNext`.
- **Popup semplificato.** Rimossi dall'header il nome "Skippy", il
  sottotitolo e l'icona; la card delle impostazioni si chiama ora
  "Funzionalità" invece di "Skip"; rimossa la nota "Valgono per Netflix,
  Prime Video, Disney+, Crunchyroll e Paramount+." sotto gli interruttori
  (l'informazione resta comunque nella descrizione dell'estensione e in
  questo file).
- **Popup multilingua.** Il testo del popup (non il funzionamento
  dell'estensione: vedi la sezione dedicata più sotto) si adatta ora in
  automatico alla lingua del browser tra italiano, inglese, francese,
  spagnolo, russo, arabo, hindi e tedesco, con l'inglese come ricaduta per
  le lingue non supportate.

## Correzioni v1.7.0

- **Trovata e corretta la vera causa del loop residuo su Prime Video.**
  Le correzioni v1.5.0 e v1.6.0 avevano già introdotto un raffreddamento
  minimo e un rilevamento loop basato sulla posizione di riproduzione, ma
  entrambi si applicavano SOLO al click generato dal selettore tecnico. Il
  ripiego testuale multilingua (`skippyFindFallbackButton`, attivo su
  Prime Video/Netflix/Disney+ come rete di sicurezza secondaria) girava
  invece su un timer completamente separato, senza alcun controllo di
  loop: poiché il testo del pulsante di skip individuato dal selettore
  tecnico combacia quasi sempre con una delle frasi riconosciute, questo
  ripiego poteva ritrovare e ricliccare lo stesso identico pulsante appena
  gestito (o scartato per raffreddamento) dal percorso protetto, aggirando
  di fatto tutte le protezioni introdotte in precedenza. Dalla v1.7.0
  entrambi i percorsi passano per un'unica funzione (`attemptSkipClick` in
  `src/core.js`) che condivide lo stesso stato: nessuno dei due può più
  aggirare il raffreddamento/anti-loop dell'altro. In più, un loop rilevato
  ora blocca i click di skip finché la riproduzione non avanza davvero
  oltre il punto bloccato, invece di riprovare comunque dopo un timeout
  fisso come nella v1.6.0.
- **Corretto "l'episodio successivo automatico" che non faceva nulla su
  Prime Video.** La finestra di conferma prima di cliccare il pulsante
  "prossimo episodio" era tracciata confrontando l'identità dell'oggetto
  DOM del pulsante (`isNextEpisodeReady` in `src/core.js`): se il player
  ricrea quell'elemento come nodo DOM nuovo ad ogni rendering (lo stesso
  comportamento già osservato per il pulsante di skip), quel confronto
  risultava sempre "diverso", la finestra di conferma si azzerava ad ogni
  singolo ciclo e l'avanzamento automatico non scattava mai, anche con il
  selettore tecnico corretto e la funzione attivata. Ora la finestra di
  conferma è legata al tempo trascorso da quando un'azione risulta
  individuata con continuità, non a quale nodo DOM specifico la rappresenti
  in un dato istante. Aggiunti anche un paio di selettori aggiuntivi per la
  "next up card" di Prime Video e un ripiego testuale multilingua dedicato
  (`SKIPPY_NEXT_FALLBACK_PHRASES`), attivo anche su Netflix e Disney+ come
  rete di sicurezza in più.
- **"Episodio successivo automatico" attivo di default.** In precedenza
  partiva disattivato; ora, come "Salta sigla/intro/recap", è attivo fin
  dalla prima installazione e resta disattivabile dal popup in qualunque
  momento.
- **Compatibilità Firefox dichiarata esplicitamente.** Il manifest era già
  tecnicamente compatibile con Firefox (Manifest V3, permesso minimo
  `storage`, nessuna API esclusiva di Chrome), ma mancava la dichiarazione
  `data_collection_permissions`, obbligatoria dal 3 novembre 2025 per
  qualunque nuova sottomissione ad AMO: senza di essa la pubblicazione
  sarebbe stata rifiutata. Aggiunta insieme al blocco `gecko_android`; il
  manifest passa ora `web-ext lint` senza errori né avvisi. Vedi la sezione
  "Installazione" più sopra per le istruzioni specifiche per Firefox.

## Localizzazione del popup

Dalla v1.6.0 il testo del popup (titoli delle card, etichette degli
interruttori, testo della donazione) è tradotto in otto lingue tramite
l'API nativa `chrome.i18n`, la stessa usata dal browser stesso e da
qualunque estensione localizzata:

- Ogni lingua ha una propria cartella in `_locales/<codice>/messages.json`
  (`it`, `en`, `fr`, `es`, `ru`, `ar`, `hi`, `de`).
- All'apertura del popup, `src/i18n.js` legge la lingua che Chrome ha già
  risolto tra quelle disponibili (in base alle lingue preferite del
  browser dell'utente, non serve alcuna configurazione manuale) e sostituisce
  il testo di ogni elemento marcato con l'attributo `data-i18n` in
  `popup.html`. Imposta anche `lang` e, per l'arabo (unica lingua tra
  quelle supportate scritta da destra a sinistra), `dir="rtl"` sull'intero
  popup.
- Se la lingua del browser non è tra le otto supportate, Chrome ricade in
  automatico su `default_locale` (impostato su `en` in `manifest.json`).
- Aggiungere una lingua in futuro significa solo creare una nuova cartella
  `_locales/<codice>/messages.json` con le stesse sette chiavi già usate
  nelle altre lingue: non serve toccare `popup.html`, `popup.js` né
  `src/i18n.js`.

**Importante:** questa localizzazione riguarda solo il testo del popup
dell'estensione. Il riconoscimento e il salto dei pulsanti sui singoli siti
(Netflix, Prime Video, ecc., vedi le sezioni precedenti) resta come prima
del tutto indipendente sia dalla lingua del browser sia dalla lingua qui
scelta per il popup: si basa su attributi/classi tecnici del sito in
riproduzione o, in ricaduta, sull'elenco `SKIPPY_FALLBACK_PHRASES` in
`src/core.js`, che riguarda la lingua dell'interfaccia di Netflix/Prime
Video/ecc. in quel momento, non quella del browser né quella del popup:
sono tre impostazioni indipendenti, per tre superfici diverse.

## Se in un paese Amazon non specificato l'estensione non funzionasse

Il file `manifest.json` include i domini Amazon più comuni
(`amazon.it`, `amazon.com`, `amazon.co.uk`, `amazon.de`, `amazon.fr`,
`amazon.es`, `amazon.co.jp`, `amazon.ca`, `amazon.com.au`,
`amazon.com.br`, `amazon.com.mx`, `amazon.in`, `amazon.nl`, `amazon.se`,
`amazon.pl`, `amazon.com.tr`, `amazon.ae`, `amazon.sa`, `amazon.eg`,
`amazon.sg`) oltre a `primevideo.com`. Se il tuo dominio Amazon non è
tra questi, aggiungi una riga tipo `"*://*.amazon.TUODOMINIO/*"`
nell'array `matches` della sezione Prime Video di `manifest.json`, poi
ricarica l'estensione dalla pagina delle estensioni del browser.

## Donazioni

Il popup include una card "Sostieni Skippy" con un pulsante di donazione
che punta al link PayPal.me impostato nella costante `SKIPPY_DONATION_URL`
in cima a `popup.js`:

```js
const SKIPPY_DONATION_URL = 'https://www.paypal.com/paypalme/D4ruerk';
```

Per cambiarlo in futuro basta modificare quella costante.

## Nota su manutenzione futura

Tutte le piattaforme aggiornano periodicamente il codice delle loro pagine,
quindi ogni selettore può smettere di funzionare in qualunque momento; il
livello di rischio però non è uguale ovunque:

- **Netflix e Prime Video**: i selettori si basano su attributi tecnici
  confermati da fonti solide (codice sorgente di Firefox, hook usati anche
  dai test automatici di Netflix). Se lo skip smette di funzionare, quasi
  certamente è cambiato l'attributo: vanno aggiornati i selettori in
  `src/netflix.js` o `src/amazon.js`.
- **Disney+**: la classe `skip__button` è confermata da più fonti
  indipendenti ma non da una fonte ufficiale. Se smette di funzionare, va
  aggiornato il selettore in `src/disney.js`; nel frattempo la rete di
  sicurezza multilingua di `core.js` continua comunque a provarci.
- **Crunchyroll e Paramount+**: qui l'estensione si affida quasi
  interamente al riconoscimento testuale multilingua di `core.js`, perché
  non è stato individuato un attributo tecnico stabile e documentato. Se in
  futuro qualcuno lo individuasse, andrebbe aggiunto come selettore
  primario nella relativa action in `src/crunchyroll.js` o
  `src/paramount.js` (al momento assente di proposito, per non introdurre
  un selettore inventato). Se invece smettesse di funzionare anche il
  riconoscimento testuale, il modo più semplice per sistemarlo è aggiungere
  la nuova dicitura del pulsante (nella lingua in cui compare) all'elenco
  `SKIPPY_FALLBACK_PHRASES` in `src/core.js`.

In tutti i casi la logica del ciclo in `src/core.js` resta invariata: solo
i selettori delle singole piattaforme vanno aggiornati.
