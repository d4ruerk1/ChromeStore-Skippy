# Skippy

Estensione per Chrome, Brave, Edge, Firefox e in generale per browser basati su Chromium o su Gecko, che salta automaticamente sigla/intro, recap e titoli di coda su Netflix, Amazon Prime Video, Disney+, Crunchyroll e Paramount+, e può avanzare da sola all'episodio successivo, indipendentemente dalla lingua impostata sull'interfaccia.

> **Progetto indipendente.** Skippy non è un'estensione ufficiale né affiliata, approvata o sponsorizzata da Netflix, Amazon, Disney, Crunchyroll, Paramount, Google o Mozilla. Netflix, Prime Video, Disney+, Crunchyroll e Paramount+ sono marchi dei rispettivi titolari, citati solo per indicare con quali servizi funziona l'estensione. Il prefisso "ChromeStore" nel nome del repository (`ChromeStore-Skippy`) indica solo lo store di destinazione previsto (Chrome Web Store) e non implica alcun legame con Google; il nome dell'estensione è e resta **Skippy**.
>
> È uno strumento indipendente basato sull'osservazione della struttura tecnica (non testuale, dove possibile) dei pulsanti di skip.

## Come funziona (e perché regge il cambio di lingua)

Il livello di affidabilità del riconoscimento varia da piattaforma a piattaforma, a seconda di quanto sia documentabile pubblicamente un attributo tecnico stabile per il pulsante di salto:

- **Netflix e Prime Video** espongono i pulsanti "salta" tramite attributi tecnici interni (ad esempio `data-uia="player-skip-intro"` su Netflix, o la classe `atvwebplayersdk-skipelement-button` su Prime Video) che restano identici qualunque sia la lingua dell'account: cambia solo l'etichetta visibile ("Salta sigla", "Skip Intro", ecc.), non l'attributo con cui Skippy riconosce il pulsante.
- **Disney+** usa in modo analogo la classe `skip__button` per qualunque pulsante di salto (confermata da più script/estensioni indipendenti, ma senza una fonte ufficiale altrettanto solida: vedi i commenti in `src/disney.js`).
- **Crunchyroll e Paramount+** non espongono, per quanto risulta pubblicamente, un attributo tecnico stabile equivalente: qui Skippy si affida principalmente al riconoscimento multilingua descritto sotto.

Come rete di sicurezza (principale su Crunchyroll e Paramount+, di riserva su Netflix/Prime Video/Disney+ nel caso quelle piattaforme modificassero i propri attributi), l'estensione riconosce il pulsante anche dal testo (o `aria-label`) confrontandolo con un elenco di frasi tipo "salta sigla" in una ventina di lingue, incluse le diciture per titoli di coda/finale più comuni sui contenuti animati.

## Installazione

### Chrome Web Store

Quando Skippy sarà approvata sul Chrome Web Store basterà installarla dalla sua scheda, senza modalità sviluppatore.

### Modalità sviluppatore (Chrome, Brave, Edge e altri browser Chromium)

1. Scarica ed estrai il repository in una posizione stabile del tuo computer (non cancellarlo dopo l'installazione: il browser lo legge da lì ogni volta che si avvia).
2. Vai alla pagina delle estensioni (`chrome://extensions`, `brave://extensions` o `edge://extensions`).
3. Attiva **Modalità sviluppatore** (interruttore in alto a destra).
4. Clicca **Carica estensione non pacchettizzata** ("Load unpacked").
5. Seleziona la cartella estratta (quella che contiene `manifest.json`).
6. Apri Netflix, Prime Video, Disney+, Crunchyroll o Paramount+, avvia un episodio: la sigla verrà saltata da sola.

Perché "non pacchettizzata": finché l'estensione non è approvata su uno store ufficiale, il browser richiede la modalità sviluppatore per caricarla da una cartella locale. È il metodo standard per le estensioni personali non distribuite tramite store.

### Firefox

Il manifest include già la sezione `browser_specific_settings.gecko` (id univoco, versione minima 140 e dichiarazione `data_collection_permissions: none`, richiesta da Mozilla dal 3 novembre 2025 per ogni nuova estensione), quindi è pronto sia per il caricamento temporaneo sia per la sottomissione ad [addons.mozilla.org](https://addons.mozilla.org) (AMO).

Per provarla subito, senza pubblicarla:

1. Estrai il repository in una posizione stabile.
2. Apri `about:debugging#/runtime/this-firefox`.
3. Clicca **Carica componente aggiuntivo temporaneo...** ("Load Temporary Add-on...").
4. Seleziona il file `manifest.json` nella cartella estratta.
5. L'estensione resta attiva fino alla chiusura di Firefox (limite dei componenti aggiuntivi temporanei, non specifico di Skippy).

Per un'installazione permanente Firefox richiede un pacchetto firmato da Mozilla: va sottomesso su AMO (anche in modalità "solo per te", senza pubblicazione pubblica) oppure installato su Firefox Developer Edition/Nightly con la verifica della firma disattivata.

## Impostazioni

Cliccando sull'icona di Skippy si apre un pannello con due interruttori, validi per tutte le piattaforme supportate ed entrambi **attivi di default**:

- **Salta sigla / intro / recap**: copre sigla/intro, riassunto/recap e titoli di coda.
- **Episodio successivo automatico**: avanza da solo all'episodio successivo quando la riproduzione è realmente vicina alla fine.

La scelta viene ricordata anche dopo il riavvio del browser. Non ci sono interruttori per singola piattaforma né un interruttore generale (rimosso dalla v1.6.0): per disattivare una funzione basta spegnere il relativo interruttore.

Il testo del popup si adatta alla lingua del browser (italiano, inglese, francese, spagnolo, russo, arabo, hindi o tedesco, con l'inglese come ricaduta). Dopo l'installazione o un cambio di impostazione, ricarica la pagina della piattaforma perché sia applicato alla riproduzione in corso.

Il pannello contiene anche un pulsante facoltativo **"Offri un caffè"** (PayPal.me): non sblocca alcuna funzione e si apre solo se lo clicchi.

## Struttura del progetto

```
ChromeStore-Skippy/
├── manifest.json        Manifest V3: nome, icone, permessi, content script
├── popup.html           Interfaccia del popup (impostazioni + donazioni)
├── popup.js             Logica del popup: legge/scrive le impostazioni
├── PRIVACY.md           Informativa privacy (IT/EN)
├── LICENSE              Licenza MIT
├── icons/               icon.svg (sorgente) + icon16/32/48/128.png
├── _locales/            Traduzioni del popup (chrome.i18n): it, en, fr, es, ru, ar, hi, de
└── src/
    ├── core.js          Impostazioni condivise + loop di auto-skip comune
    ├── i18n.js          Localizzazione del testo del popup
    ├── netflix.js       Configurazione (selettori) di Netflix
    ├── amazon.js        Configurazione (selettori) di Prime Video
    ├── disney.js        Configurazione (selettori) di Disney+
    ├── crunchyroll.js   Configurazione di Crunchyroll
    └── paramount.js     Configurazione di Paramount+
```

Tutte le piattaforme condividono la stessa logica (carica le impostazioni, osserva i cambiamenti, prova i selettori tecnici in ordine di priorità, ripiega sul riconoscimento multilingua), che vive una sola volta in `src/core.js`; ogni file di piattaforma descrive solo la propria configurazione.

## Note tecniche su efficienza e robustezza

- Su Netflix il content script viene caricato solo sulle pagine `netflix.com/watch/...`.
- Su Amazon/Prime Video lo script verifica prima, con una sola ricerca per id (`#dv-web-player`), se sei in riproduzione; altrimenti si ferma subito, così resta leggero mentre navighi il negozio.
- Su Netflix e Prime Video i pulsanti sono cercati solo dentro il contenitore del player, per non intercettare altri elementi con testo simile.
- Su Disney+, Crunchyroll e Paramount+ la "guardia" verifica che in pagina ci sia un elemento `<video>` in riproduzione prima di cercare i pulsanti.
- Su Crunchyroll e Paramount+ non si usano selettori generici "a indovinare" (es. attributi contenenti "skip"), che intercetterebbero i link di accessibilità "salta al contenuto": si usa solo il riconoscimento di frasi complete ("skip intro", "salta sigla", ecc.).
- Il player di Crunchyroll può stare in un iframe su `static.crunchyroll.com`: il content script è registrato con `"all_frames": true`.

## Cronologia delle versioni

- **v1.7.0**: corretta la vera causa del loop su Prime Video (selettore tecnico e ripiego testuale ora passano entrambi per `attemptSkipClick` in `src/core.js`, con stato anti-loop condiviso; un loop rilevato blocca i click finché la riproduzione non avanza davvero). Corretto l'episodio successivo automatico su Prime Video (finestra di conferma basata sul tempo e non sull'identità del nodo DOM), aggiunti selettori per la "next up card" e il ripiego testuale `SKIPPY_NEXT_FALLBACK_PHRASES`. Episodio successivo automatico attivo di default. Dichiarazione Firefox `data_collection_permissions: none`.
- **v1.6.0**: rilevamento loop basato su `video.currentTime` (`skipLoopPositionEpsilon`), rimosso l'interruttore generale, popup semplificato e multilingua.
- **v1.5.0**: impostazioni ridotte a due chiavi condivise (`skipIntro`, `autoNext`), raffreddamento `skipActionCooldownMs` contro i click ripetuti su Prime Video, click sintetico con sequenza pointer/mouse completa, scansione testuale più leggera (testo controllato prima della visibilità).
- **v1.4.0**: rilevamento guidato da `MutationObserver` (intervallo di riserva 250 ms, 150 ms su Crunchyroll/Paramount+), visibilità calcolata con `getClientRects()` anche per overlay `position: fixed`, conferma dell'episodio successivo (600/1200 ms, soglia 15% della durata tra 60 e 240 s, raffreddamento 4 s).

Tutte le soglie sono parametri in cima a `skippyCreateAutoSkipLoop` (`src/core.js`) e si possono affinare per piattaforma dal relativo file in `src/` (es. `nextEpisodeConfirmMs`, `fallbackIntervalMs`).

## Privacy

Nessun dato raccolto o trasmesso, nessun server, analytics o codice remoto. Solo due preferenze salvate in locale (`chrome.storage.local`). Dettagli in [`PRIVACY.md`](PRIVACY.md) (GDPR, D.Lgs. 196/2003, ePrivacy). Su Firefox il manifest dichiara `data_collection_permissions: none`.

## Avvertenze legali

- **Cosa fa e cosa non fa.** Skippy clicca soltanto i pulsanti "Salta intro/recap/titoli" ed "Episodio successivo" che la piattaforma stessa mostra all'utente, come faresti tu con il mouse. **Non** aggira DRM o misure tecnologiche di protezione (art. 102-quater L. 633/1941, art. 6 Direttiva 2001/29/CE), non scarica né registra video, non modifica la pubblicità e non dà accesso a contenuti non inclusi nel tuo abbonamento.
- **Termini di Netflix e Prime Video (rischio di automazione).** Le Condizioni d'uso di Netflix vietano di accedere al servizio con robot, scraper o altri "mezzi automatizzati", e le condizioni di Amazon Prime Video contengono divieti analoghi sull'uso di strumenti automatizzati o non autorizzati. Un click automatico sui pulsanti del player potrebbe essere considerato in contrasto con queste clausole. Non risultano casi noti di sospensione legati a estensioni di questo tipo, ma in teoria la piattaforma potrebbe limitare o sospendere l'account. **L'uso è a tua discrezione e sotto la tua responsabilità**: se vuoi azzerare il rischio, disattiva i due interruttori o non usare l'estensione su quei servizi. Le stesse considerazioni valgono per Disney+, Crunchyroll e Paramount+.
- **Nessuna garanzia.** Il software è fornito "così com'è" secondo la licenza MIT: le piattaforme possono cambiare il player in qualsiasi momento.
- **Donazioni.** Il pulsante "Offri un caffè" è facoltativo e non sblocca alcuna funzione. Le donazioni volontarie non rendono lo sviluppatore un *trader* ai sensi del Digital Services Act: sul Chrome Web Store si dichiara **non trader**, senza pubblicare indirizzo, telefono o email personale.

## Pubblicazione sugli store

- **Chrome Web Store**: scheda Privacy = nessun dato raccolto, tre certificazioni spuntate, URL dell'informativa = versione pubblica di `PRIVACY.md`. Giustificazioni: `storage` = salvare le due preferenze; host = content script limitati ai domini delle cinque piattaforme per riconoscere e cliccare i pulsanti di salto. Nel titolo e nell'icona non usare nomi o loghi delle piattaforme (regole sull'impersonificazione); nella descrizione vanno bene solo come indicazione di compatibilità. Nome della scheda: **Skippy** (senza "ChromeStore").
- **addons.mozilla.org**: il manifest è già pronto (`browser_specific_settings.gecko`, `data_collection_permissions: none`). Indica il link a `PRIVACY.md` nella scheda dell'add-on.

## Licenza

MIT, vedi [`LICENSE`](LICENSE).
