/*
 * core.js
 * Impostazioni condivise, funzioni di utilità e loop di auto-skip di Skippy.
 * Caricato sia dai content script (Netflix, Prime Video, Disney+,
 * Crunchyroll, Paramount+) sia dal popup.
 */

// Valori di default. Da qui (v1.5.0) le impostazioni non sono più divise per
// piattaforma: "skipIntro" (sigla/intro/recap/titoli di coda) e "autoNext"
// (episodio successivo) valgono per tutti i siti supportati, per tenere il
// popup con un solo interruttore per funzione invece di uno per ciascuna
// piattaforma. Dalla v1.7.0 entrambe le funzioni sono attive di default
// all'installazione (in precedenza autoNext partiva disattivato): chi non la
// vuole può comunque spegnerla dal popup in qualunque momento.
//
// Nota (v1.6.0): l'ex interruttore generale "skippyEnabled" (attiva/disattiva
// tutta l'estensione con un solo comando) è stato rimosso insieme al relativo
// controllo nel popup: da qui l'estensione applica sempre skipIntro e
// autoNext secondo le rispettive preferenze, senza un interruttore master
// separato. Chi aveva installazioni precedenti con skippyEnabled impostato su
// false nello storage non ne risente: quella chiave non viene più letta da
// nessun content script, quindi il comportamento riparte da skipIntro/
// autoNext così come impostati.
const SKIPPY_DEFAULTS = {
  skipIntro: true,
  autoNext: true
};

function skippyGetSettings(callback) {
  chrome.storage.local.get(SKIPPY_DEFAULTS, callback);
}

function skippyWatchSettings(onChange) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const updates = {};
    for (const key in changes) updates[key] = changes[key].newValue;
    onChange(updates);
  });
}

// Rete di sicurezza multilingua: su Netflix e Prime Video entra in gioco
// SOLO se i selettori tecnici principali (basati su attributi/classi
// stabili, indipendenti dalla lingua) non trovano nulla, ad esempio se in
// futuro le piattaforme cambiassero quegli attributi. Su Crunchyroll e
// Paramount+, dove non risulta un attributo tecnico stabile e documentato
// altrettanto affidabile (vedi commenti in src/crunchyroll.js e
// src/paramount.js), questa è invece la via principale con cui vengono
// riconosciuti i pulsanti di salto. Si basa su frasi complete ("salta
// sigla", "skip intro", ecc.) e non su singole parole, per evitare di
// cliccare per errore altri pulsanti (es. "avanti di 10 secondi", oppure i
// link di accessibilità "salta al contenuto" presenti su moltissimi siti).
//
// Oltre alle sigle/intro e ai recap già coperti da Netflix e Prime Video,
// l'elenco include anche le diciture per titoli di coda/finale, più comuni
// su Disney+, Crunchyroll e Paramount+ (dove i contenuti sono spesso serie
// animate con sigla di apertura E di chiusura distinte).
const SKIPPY_FALLBACK_PHRASES = [
  'salta sigla', 'salta intro', 'salta apertura', 'salta il riassunto',
  'salta titoli di coda', 'salta i titoli di coda', 'salta finale',
  'skip intro', 'skip recap', 'skip credits', 'skip opening',
  'skip ending', 'skip outro', 'skip recap opening',
  'saltar intro', 'saltar resumen', 'saltar apertura', 'saltar creditos',
  'intro überspringen', 'vorspann überspringen', 'opening überspringen',
  'abspann überspringen', 'credits überspringen', 'ending überspringen',
  "passer l'intro", 'passer le générique', 'passer le générique de fin',
  'pular abertura', 'pular introdução', 'pular resumo', 'pular créditos',
  'pomiń intro', 'pomiń czołówkę', 'pomiń napisy końcowe',
  "intro'yu geç", 'jeneriği geç', 'özeti geç',
  'пропустить заставку', 'пропустить интро', 'пропустить титры',
  'オープニングをスキップ', 'イントロをスキップ', 'エンディングをスキップ',
  '跳过片头', '跳过片头曲', '跳过片尾',
  '인트로 건너뛰기', '오프닝 건너뛰기', '엔딩 건너뛰기',
  'intro overslaan',
  'hoppa över intro',
  'ohita intro',
  'hopp over intro',
  'přeskočit znělku',
  'bevezető kihagyása',
  'παράλειψη εισαγωγής',
  'تخطي المقدمة',
  'דלג על הפתיח',
  'ข้ามอินโทร',
  'bỏ qua phần giới thiệu',
  'lewati intro'
];

/*
 * SKIPPY_NEXT_FALLBACK_PHRASES (v1.7.0)
 * Stessa idea di SKIPPY_FALLBACK_PHRASES, ma per il pulsante "episodio
 * successivo" invece che per gli skip. Introdotta perché su Prime Video
 * l'avanzamento automatico poteva non scattare anche con il pulsante
 * tecnico corretto individuato nel DOM (vedi il commento su
 * "isNextEpisodeReady" più sotto per la causa reale): questo elenco serve
 * da ripiego indipendente dal selettore tecnico di ciascuna piattaforma,
 * comunque soggetto alla stessa finestra di conferma e allo stesso
 * controllo sulla posizione di riproduzione di ogni altra azione 'next',
 * così da non far scattare l'avanzamento "in anticipo" solo perché il
 * ripiego testuale ha trovato qualcosa altrove in pagina.
 */
const SKIPPY_NEXT_FALLBACK_PHRASES = [
  'prossimo episodio', 'episodio successivo', 'guarda il prossimo episodio',
  'riproduci il prossimo episodio',
  'next episode', 'play next episode', 'watch next episode',
  'próximo episodio', 'siguiente episodio', 'ver próximo episodio',
  'reproducir siguiente episodio',
  'épisode suivant', 'prochain épisode', "lire l'épisode suivant",
  'nächste folge', 'nächste episode', 'nächste episode abspielen',
  'próximo episódio', 'episódio seguinte',
  'следующая серия', 'следующий эпизод',
  'الحلقة التالية',
  'अगला एपिसोड'
];

/*
 * skippyTextMatchesPhrases
 * Normalizzazione e confronto testuale condivisi da entrambe le reti di
 * sicurezza multilingua (skip ed episodio successivo): stessa logica,
 * elenco di frasi diverso a seconda del chiamante.
 */
function skippyTextMatchesPhrases(text, phrases) {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  if (!normalized || normalized.length > 40) return false; // evita falsi positivi su testi lunghi
  return phrases.some((phrase) => normalized.includes(phrase));
}

function skippyTextLooksLikeSkip(text) {
  return skippyTextMatchesPhrases(text, SKIPPY_FALLBACK_PHRASES);
}

/*
 * skippyIsVisible
 * Verifica di visibilità reale dell'elemento, non solo "presente nel DOM".
 *
 * Correzione rispetto alla versione precedente: il solo controllo
 * `offsetParent !== null` ha un difetto noto e documentato del DOM,
 * indipendente da Skippy stesso: offsetParent è SEMPRE null per gli
 * elementi in `position: fixed` (una tecnica comune per gli overlay dei
 * player video, specialmente a schermo intero), quindi un pulsante di
 * salto perfettamente visibile poteva risultare "invisibile" per Skippy in
 * quelle condizioni, causando skip mancati o percepiti come "in ritardo"
 * (recuperati solo se e quando l'elemento cambiava layout). Si usa quindi
 * `getClientRects()`, affidabile anche per elementi fixed, insieme a un
 * controllo esplicito di stile calcolato (display/visibility/opacità) per
 * escludere elementi tecnicamente "in pagina" ma non ancora realmente
 * interattivi (es. a metà di una transizione CSS di dissolvenza in
 * ingresso), che altrimenti rischierebbero di essere cliccati un istante
 * troppo presto.
 */
function skippyIsVisible(el) {
  if (!el || el.disabled) return false;
  if (el.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  if (parseFloat(style.opacity || '1') === 0) return false;
  return true;
}

/*
 * skippyFindButtonByPhrases
 * Usata sia per il ripiego "skip" (skippyFindFallbackButton, sotto) sia per
 * il ripiego "episodio successivo" (SKIPPY_NEXT_FALLBACK_PHRASES, vedi
 * tick() in skippyCreateAutoSkipLoop): stessa scansione, elenco di frasi
 * diverso a seconda del chiamante.
 *
 * Ordine dei controlli scelto apposta per il costo, non solo per la logica:
 * il controllo del testo (stringa) è economico, mentre skippyIsVisible
 * costringe il browser a un ricalcolo sincrono del layout (getClientRects
 * + getComputedStyle). Controllando prima il testo, quel ricalcolo viene
 * eseguito solo sui pochissimi elementi il cui testo assomiglia già a un
 * pulsante di salto, invece che su OGNI bottone/link/anchor della pagina ad
 * ogni scansione. Su Crunchyroll e Paramount+, dove questa funzione è il
 * meccanismo di riconoscimento principale (non un semplice ripiego) e gira
 * fino a una volta ogni 150 ms su tutta la pagina, il vecchio ordine (prima
 * la visibilità, poi il testo) era la causa più probabile del rallentamento
 * del video percepito dagli utenti durante la riproduzione.
 */
function skippyFindButtonByPhrases(root, phrases) {
  const scope = root || document;
  const candidates = scope.querySelectorAll('button, [role="button"], a');
  for (const el of candidates) {
    const label = el.getAttribute('aria-label') || el.textContent || '';
    if (!skippyTextMatchesPhrases(label, phrases)) continue;
    if (!skippyIsVisible(el)) continue;
    return el;
  }
  return null;
}

function skippyFindFallbackButton(root) {
  return skippyFindButtonByPhrases(root, SKIPPY_FALLBACK_PHRASES);
}

/*
 * skippyClick
 * Non ci si affida al solo el.click(): alcuni pulsanti di salto sono
 * elementi generici (div/span con role="button", non <button> nativi)
 * gestiti da framework che reagiscono a pointerdown/mousedown piuttosto che
 * al solo evento "click" sintetico. In quei casi el.click() da solo può
 * risultare in un pulsante correttamente individuato ma che non produce
 * alcun effetto reale sul player, percepito dall'utente come uno spezzone
 * "non rilevato" anche se in realtà era stato trovato. Si invia quindi
 * prima una sequenza pointerdown/mousedown/pointerup/mouseup e poi comunque
 * el.click(), così da coprire sia i componenti che ascoltano gli eventi
 * puntatore sia i normali elementi HTML cliccabili.
 */
function skippyClick(el) {
  try {
    const rect = el.getClientRects()[0];
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, button: 0, buttons: 1 };
    if (typeof PointerEvent === 'function') el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    if (typeof PointerEvent === 'function') el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.click();
    return true;
  } catch (err) {
    return false;
  }
}

/*
 * skippyFindActiveVideo
 * Individua l'elemento <video> rilevante nello scope indicato (il
 * contenitore del player quando disponibile, altrimenti l'intero
 * documento), preferendo uno i cui metadati siano già stati caricati
 * (readyState >= 1 = HAVE_METADATA), condizione necessaria perché
 * `duration` sia un numero utilizzabile. Usato esclusivamente per calibrare
 * la soglia temporale dell'avanzamento automatico all'episodio successivo
 * (vedi skippyIsNextEpisodeReady): non incide in alcun modo sulla velocità
 * di reazione degli skip di sigla/recap/titoli di coda.
 */
function skippyFindActiveVideo(scope) {
  const root = (scope && typeof scope.querySelectorAll === 'function') ? scope : document;
  const videos = root.querySelectorAll('video');
  for (const v of videos) {
    if (v.readyState >= 1) return v;
  }
  return videos[0] || null;
}

/*
 * skippyCreateAutoSkipLoop
 * Logica operativa comune ai content script di tutte le piattaforme
 * supportate: carica le impostazioni, osserva i cambiamenti, prova i
 * selettori in ordine di priorità, ripiega sulla rete di sicurezza
 * multilingua. Ogni piattaforma si limita a descrivere la propria
 * configurazione.
 *
 * Rilevamento (perché lo skip non deve più "arrivare in ritardo"):
 * la versione precedente si basava solo su un polling a intervallo fisso
 * (400 ms per ogni azione, fino a 2000 ms per il ripiego testuale), quindi
 * un pulsante poteva restare visibile fino a quell'intervallo prima di
 * essere cliccato. Ora il rilevamento è guidato dagli eventi: un
 * MutationObserver osserva il contenitore del player (o l'intero documento
 * finché il contenitore non esiste ancora) e fa scattare subito un
 * controllo ad ogni cambiamento del DOM rilevante (nodi aggiunti/rimossi,
 * o attributi tipici usati per mostrare/nascondere un elemento: class,
 * style, hidden, aria-hidden, disabled). L'intervallo fisso resta attivo
 * solo come rete di sicurezza economica (default 250 ms, contro i 400 ms
 * precedenti) per i rari casi che un MutationObserver potrebbe non coprire.
 * I controlli multipli generati da una raffica di mutazioni ravvicinate
 * vengono uniti in un solo giro tramite requestAnimationFrame, per restare
 * comunque leggero.
 *
 * Avanzamento automatico all'episodio successivo (perché non deve più
 * scattare "in anticipo"): a differenza degli skip di sigla/recap/titoli di
 * coda, che vanno eseguiti il prima possibile appena il pulsante compare,
 * cliccare il pulsante "episodio successivo" nello stesso istante in cui
 * diventa tecnicamente individuabile nel DOM espone a due problemi diversi:
 *  1) un elemento può risultare "visibile" per un solo istante per motivi
 *     transitori (es. durante un repaint, o perché su Crunchyroll/
 *     Paramount+ la ricerca del pulsante avviene sull'intera pagina, non
 *     solo dentro il player, e potrebbe intercettare un elemento con lo
 *     stesso pattern di attributi presente altrove, ad esempio in un
 *     carosello "consigliati");
 *  2) anche quando il pulsante è genuinamente quello del player, cliccarlo
 *     nell'istante stesso in cui compare può interrompere l'episodio prima
 *     del previsto se compare con largo anticipo sulla fine reale.
 * Per questo un'azione con kind: 'next' non viene mai cliccata al primo
 * avvistamento: deve restare visibile con continuità per una finestra di
 * conferma (nextEpisodeConfirmMs, default 600 ms; nextEpisodeConfirmMsUnknownDuration,
 * default 1200 ms se la durata del video non è ancora nota) e, quando la
 * durata del <video> associato è nota, deve corrispondere a una posizione
 * di riproduzione realmente vicina alla fine: la soglia è calcolata come
 * `clamp(durata * 15%, 60s, 240s)` di tempo rimanente, per adattarsi sia a
 * episodi brevi sia a episodi lunghi senza dover indovinare un valore
 * fisso uguale per tutti. Se la durata non è determinabile (metadati non
 * ancora caricati, streaming protetto, ecc.) si usa solo la finestra di
 * conferma più lunga come unica rete di sicurezza.
 *
 * config:
 *  - getContainer(): restituisce il contenitore del player o null
 *  - actions: [{ settingKey, selectors: [...], kind, fallbackPhrases }], in
 *    ordine di priorità. kind è 'skip' (default, click immediato appena
 *    trovato) o 'next' (click solo dopo la conferma descritta sopra).
 *    fallbackPhrases è opzionale e vale solo per kind: 'next' (vedi sotto).
 *  - fallbackSettingKeys: chiavi che abilitano la rete di sicurezza testuale
 *    per le azioni 'skip' (SKIPPY_FALLBACK_PHRASES)
 *  - intervalMs: intervallo di backstop del ciclo, default 250
 *  - fallbackIntervalMs: intervallo minimo tra due scansioni del ripiego
 *    testuale per lo skip, default 400 (Netflix/Prime Video/Disney+, dove è
 *    solo un ripiego secondario); Crunchyroll e Paramount+ lo abbassano a
 *    150 dato che lì è il meccanismo principale.
 *  - nextFallbackIntervalMs (default 400): stesso principio di
 *    fallbackIntervalMs, ma per la scansione testuale delle azioni 'next'
 *    che specificano fallbackPhrases (vedi sotto).
 *  - nextEpisodeConfirmMs / nextEpisodeConfirmMsUnknownDuration: vedi sopra.
 *  - nextEpisodeCooldownMs (default 4000): dopo un click su un'azione
 *    'next', le azioni 'next' vengono ignorate per questo intervallo. Senza
 *    questo margine, se il sito non rimuove/sostituisce subito il pulsante
 *    dopo il click (es. durante la breve transizione verso l'episodio
 *    successivo), Skippy lo ricliccherebbe più volte di seguito nel giro di
 *    pochi cicli: innocuo nella maggior parte dei casi, ma non necessario e
 *    potenzialmente interferente se il sito interpreta i click ripetuti come
 *    "salta più episodi".
 *  - skipActionCooldownMs / skipLoopPositionEpsilon / skipLoopMaxAttempts:
 *    vedi il punto dedicato qui sotto (raffreddamento minimo tra un click di
 *    skip e il successivo, e rilevamento di un loop in corso).
 *
 * Ripiego testuale per l'episodio successivo (fallbackPhrases, v1.7.0):
 * su alcune piattaforme il pulsante "episodio successivo" può essere
 * individuato correttamente nel DOM tramite selettore tecnico, eppure
 * l'avanzamento non scattava comunque (vedi il caso reale osservato su
 * Prime Video, descritto nel commento di isNextEpisodeReady più sotto). Per
 * questo, un'azione con kind: 'next' può specificare anche
 * fallbackPhrases: [...] (vedi SKIPPY_NEXT_FALLBACK_PHRASES): se i selettori
 * tecnici non trovano nulla, si prova anche un riconoscimento testuale
 * multilingua dello stesso tipo già usato per lo skip, con throttling
 * indipendente (nextFallbackIntervalMs) per restare economico. L'elemento
 * trovato in questo modo passa comunque per la STESSA finestra di conferma
 * e lo stesso controllo sulla posizione di riproduzione di un elemento
 * trovato via selettore, quindi non scatta "in anticipo" solo perché
 * individuato per via testuale.
 *
 * Raffreddamento minimo tra un click di skip e il successivo, e
 * rilevamento di un loop in corso (skipActionCooldownMs, default 1200;
 * skipLoopPositionEpsilon, default 2 secondi; skipLoopMaxAttempts, default
 * 2): caso reale osservato su Prime Video, in due varianti concrete.
 *  1) Dopo il click, il pulsante può restare tecnicamente "visibile" (anche
 *     come stesso elemento DOM) per una breve finestra prima che il sito lo
 *     nasconda o lo rimuova davvero; se il sito, ricevendo un secondo click
 *     ravvicinato, riposiziona la riproduzione sul punto di salto originale
 *     invece di ignorarlo, il risultato percepito è un video che continua a
 *     saltare sempre allo stesso punto.
 *  2) Il player può anche ricreare il pulsante come nodo DOM NUOVO ad ogni
 *     rendering (stessa classe, stessa posizione a schermo, stesso pulsante
 *     dal punto di vista dell'utente, ma un oggetto diverso in memoria): un
 *     raffreddamento legato al solo riferimento dell'elemento (`el ===
 *     ultimoElementoCliccato`) non lo riconoscerebbe mai come "già
 *     cliccato" in questo caso.
 * Per questo il raffreddamento NON è legato all'identità dell'elemento né
 * alla singola azione: `skipActionCooldownMs` è un intervallo minimo
 * GLOBALE fra due click di tipo 'skip' qualsiasi (selettore tecnico o
 * ripiego testuale, per qualunque azione), a prescindere da quale elemento
 * specifico venga cliccato. In aggiunta, il ciclo osserva anche
 * `video.currentTime`: se per skipLoopMaxAttempts click consecutivi (ognuno
 * rispettoso del raffreddamento minimo) la posizione di riproduzione non si
 * allontana di più di skipLoopPositionEpsilon secondi dal punto del primo di
 * quei click, si presume un loop in corso e si smette del tutto di cliccare
 * azioni 'skip' finché la posizione di riproduzione non si allontana
 * davvero da quel punto oltre l'epsilon (non un timeout fisso dopo il quale
 * si riprova comunque, come nella v1.6.0: qui il blocco resta finché non
 * c'è un progresso reale, altrimenti un sito che continua a non rispondere
 * ai click verrebbe ricliccato all'infinito a intervalli regolari).
 *
 * IMPORTANTE (root cause del loop residuo osservato dopo v1.5.0/v1.6.0):
 * fino alla v1.6.0 questo raffreddamento/anti-loop si applicava SOLO al
 * click generato dal selettore tecnico dentro al ciclo `for` qui sotto, ma
 * NON al click generato dal ripiego testuale (skippyFindFallbackButton),
 * che veniva eseguito subito dopo con il proprio timer indipendente
 * (fallbackIntervalMs, non pensato come cooldown anti-loop) e senza alcun
 * controllo di posizione. Su Netflix/Prime Video/Disney+, dove
 * fallbackSettingKeys include 'skipIntro' come rete di sicurezza, il testo
 * visibile del pulsante di skip individuato dal selettore tecnico combacia
 * quasi sempre anche con una delle SKIPPY_FALLBACK_PHRASES: il ripiego
 * testuale poteva quindi ritrovare e ricliccare lo STESSO elemento appena
 * gestito (o scartato per raffreddamento) dal ciclo `for`, aggirando di
 * fatto tutte le protezioni pensate apposta per quel click. È lo scenario
 * più probabile dietro un loop che continuava a manifestarsi anche con le
 * correzioni v1.5.0/v1.6.0 già attive. Dalla v1.7.0 il click generato dal
 * ripiego testuale passa per la stessa funzione (attemptSkipClick, vedi più
 * sotto) e lo stesso stato condiviso del click generato da selettore, quindi
 * nessuno dei due può più aggirare il raffreddamento/anti-loop dell'altro.
 */
function skippyCreateAutoSkipLoop(config) {
  let settings = Object.assign({}, SKIPPY_DEFAULTS);
  skippyGetSettings((s) => { settings = s; });
  skippyWatchSettings((updates) => { Object.assign(settings, updates); });

  const intervalMs = config.intervalMs || 250;
  const fallbackIntervalMs = (config.fallbackIntervalMs != null) ? config.fallbackIntervalMs : 400;
  const nextFallbackIntervalMs = (config.nextFallbackIntervalMs != null) ? config.nextFallbackIntervalMs : 400;
  const nextConfirmMs = (config.nextEpisodeConfirmMs != null) ? config.nextEpisodeConfirmMs : 600;
  const nextConfirmMsUnknownDuration = (config.nextEpisodeConfirmMsUnknownDuration != null)
    ? config.nextEpisodeConfirmMsUnknownDuration
    : 1200;
  const nextCooldownMs = (config.nextEpisodeCooldownMs != null) ? config.nextEpisodeCooldownMs : 4000;
  const skipCooldownMs = (config.skipActionCooldownMs != null) ? config.skipActionCooldownMs : 1200;
  const skipLoopPositionEpsilon = (config.skipLoopPositionEpsilon != null) ? config.skipLoopPositionEpsilon : 2;
  const skipLoopMaxAttempts = (config.skipLoopMaxAttempts != null) ? config.skipLoopMaxAttempts : 2;

  let lastFallbackAt = 0;
  let lastNextFallbackAt = 0;
  // Stato condiviso del click di tipo 'skip', usato da attemptSkipClick per
  // QUALUNQUE azione 'skip' e per il ripiego testuale: vedi il commento su
  // "IMPORTANTE (root cause del loop residuo...)" più sopra sul perché deve
  // essere unico invece che duplicato per ciascun meccanismo.
  let lastSkipAt = 0; // istante dell'ultimo click 'skip' qualsiasi (raffreddamento globale)
  let skipLoopAnchorPos = null; // video.currentTime al primo click "sospetto" della serie corrente
  let skipLoopCount = 0;
  let skipLoopBlockedPos = null; // posizione "avvelenata" da un loop rilevato: nessun click 'skip' finché non ce ne si allontana
  let nextFirstSeenAt = null; // istante da cui un'azione 'next' risulta individuata con continuità
  let nextCooldownUntil = 0;
  let observedTarget = null;
  let observer = null;
  let scheduled = false;

  function resetNextCandidate() {
    nextFirstSeenAt = null;
  }

  // Azzera lo stato del rilevatore di loop (vedi commento su
  // skipLoopPositionEpsilon più sopra). Richiamata quando il contenitore del
  // player scompare (fine riproduzione, cambio pagina) o dopo un
  // avanzamento all'episodio successivo, così un punto di riferimento
  // relativo a un episodio o a una sessione di riproduzione precedente non
  // resta ad influenzare, per coincidenza, la nuova.
  function resetSkipLoop() {
    skipLoopAnchorPos = null;
    skipLoopCount = 0;
    skipLoopBlockedPos = null;
  }

  function findVisible(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el && skippyIsVisible(el)) return el;
    }
    return null;
  }

  /*
   * attemptSkipClick
   * Punto di ingresso UNICO per qualunque click di tipo 'skip', che sia
   * stato trovato tramite selettore tecnico (dentro al ciclo `for` di
   * tick()) o tramite il ripiego testuale multilingua: condividendo lo
   * stesso stato (lastSkipAt, skipLoopAnchorPos, skipLoopBlockedPos) i due
   * meccanismi non possono più aggirarsi a vicenda (vedi il commento
   * "IMPORTANTE" nella documentazione di skippyCreateAutoSkipLoop). `pos` è
   * `video.currentTime` al momento della valutazione (già letto una sola
   * volta per tick, non ricalcolato qui). Restituisce true se ha cliccato.
   */
  function attemptSkipClick(el, nowTick, pos) {
    // 0) Zona bloccata da un loop rilevato in precedenza: nessun click
    //    finché la posizione non se ne allontana davvero (vedi sotto).
    if (skipLoopBlockedPos != null) {
      if (pos != null && Math.abs(pos - skipLoopBlockedPos) <= skipLoopPositionEpsilon) {
        return false;
      }
      skipLoopBlockedPos = null; // progresso reale: si riparte puliti
    }

    // 1) Raffreddamento minimo GLOBALE fra un click 'skip' e il successivo,
    //    indipendente dall'elemento specifico: vedi il commento dedicato.
    if (nowTick - lastSkipAt < skipCooldownMs) return false;

    // 2) Rilevamento loop per posizione: se il video non si allontana dal
    //    punto del primo click "sospetto" di più di skipLoopPositionEpsilon
    //    secondi, per skipLoopMaxAttempts click di fila, si presume un loop
    //    e si blocca ogni ulteriore click 'skip' finché quella posizione non
    //    viene superata (vedi punto 0).
    if (pos != null && skipLoopAnchorPos != null && Math.abs(pos - skipLoopAnchorPos) <= skipLoopPositionEpsilon) {
      skipLoopCount += 1;
      if (skipLoopCount >= skipLoopMaxAttempts) {
        skipLoopBlockedPos = skipLoopAnchorPos;
        skipLoopCount = 0;
        skipLoopAnchorPos = null;
        return false;
      }
    } else {
      skipLoopAnchorPos = pos;
      skipLoopCount = 1;
    }

    skippyClick(el);
    lastSkipAt = nowTick;
    return true;
  }

  /*
   * isNextEpisodeReady
   * Vero solo se un'azione 'next' risulta individuata con continuità
   * abbastanza a lungo E (quando la durata del video è nota) la
   * riproduzione è realmente vicina alla fine. Vedi il commento generale
   * della funzione per la logica delle soglie.
   *
   * Corretto in v1.7.0 (causa reale dietro "l'episodio successivo
   * automatico non fa nulla" osservato su Prime Video): la versione
   * precedente tracciava la finestra di conferma per IDENTITÀ dell'elemento
   * DOM (`nextCandidate.el !== el` faceva ripartire `firstSeenAt` da capo).
   * Esattamente come per il pulsante di skip (vedi il commento
   * sull'anti-loop più sopra), se il player ricrea la "next up card" come
   * nodo DOM nuovo ad ogni rendering, quel confronto risultava SEMPRE vero:
   * la finestra di conferma veniva azzerata ad ogni singolo tick, l'elapsed
   * non raggiungeva mai nextConfirmMs/nextConfirmMsUnknownDuration, e
   * l'avanzamento automatico non scattava MAI, anche con il selettore
   * tecnico corretto e la funzione attiva. Ora la finestra di conferma è
   * legata solo al tempo trascorso da quando QUALCHE elemento corrispondente
   * risulta individuato con continuità (nextFirstSeenAt, azzerato da
   * resetNextCandidate quando l'azione non trova più nulla), non a quale
   * nodo DOM specifico lo rappresenti in un dato istante.
   */
  function isNextEpisodeReady(container) {
    const now = Date.now();
    if (nextFirstSeenAt == null) nextFirstSeenAt = now;
    const elapsed = now - nextFirstSeenAt;
    const video = skippyFindActiveVideo(container);

    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      const remaining = video.duration - video.currentTime;
      const threshold = Math.min(240, Math.max(60, video.duration * 0.15));
      return elapsed >= nextConfirmMs && remaining <= threshold;
    }

    // Durata non disponibile: nessuna verifica di posizione possibile, ci si
    // affida a una finestra di conferma più prudente come unica rete di
    // sicurezza contro falsi positivi transitori.
    return elapsed >= nextConfirmMsUnknownDuration;
  }

  function tick() {
    const container = config.getContainer();
    // Se non c'è un player attivo (es. schermata di caricamento tra un
    // episodio e l'altro, o pagine del sito fuori dalla riproduzione) non
    // c'è nulla da fare: usciamo subito, così il controllo resta economico
    // anche quando il player non è montato.
    if (!container) {
      resetNextCandidate();
      resetSkipLoop();
      rescopeObserver(null);
      return;
    }
    rescopeObserver(container);

    const nowTick = Date.now();
    // video.currentTime letto una sola volta per giro: serve sia al
    // rilevamento loop delle azioni 'skip' (tramite attemptSkipClick) sia,
    // indirettamente, come riferimento temporale condiviso del giro.
    const activeVideo = skippyFindActiveVideo(container);
    const pos = (activeVideo && Number.isFinite(activeVideo.currentTime)) ? activeVideo.currentTime : null;

    for (const action of config.actions) {
      if (!settings[action.settingKey]) {
        if (action.kind === 'next') resetNextCandidate();
        continue;
      }

      if (action.kind === 'next') {
        let el = findVisible(container, action.selectors);

        // Ripiego testuale multilingua (v1.7.0, vedi fallbackPhrases nella
        // documentazione sopra): solo se il selettore tecnico non ha
        // trovato nulla, con throttling indipendente per restare economico.
        if (!el && action.fallbackPhrases && action.fallbackPhrases.length &&
            nowTick - lastNextFallbackAt >= nextFallbackIntervalMs) {
          lastNextFallbackAt = nowTick;
          const candidate = skippyFindButtonByPhrases(container, action.fallbackPhrases);
          if (candidate) el = candidate;
        }

        if (!el) {
          resetNextCandidate();
          continue;
        }

        if (nowTick < nextCooldownUntil) continue; // appena cliccato: in raffreddamento
        if (isNextEpisodeReady(container)) {
          skippyClick(el);
          resetNextCandidate();
          resetSkipLoop();
          nextCooldownUntil = nowTick + nextCooldownMs;
          return;
        }
        // Non ancora confermato: non blocca la valutazione delle altre
        // azioni (es. skip sigla), che restano indipendenti e immediate.
        continue;
      }

      // kind: 'skip' (default): qualunque click passa da attemptSkipClick,
      // che applica raffreddamento minimo e rilevamento loop (vedi sopra).
      const el = findVisible(container, action.selectors);
      if (!el) continue;
      if (attemptSkipClick(el, nowTick, pos)) return;
    }

    // Ripiego testuale multilingua per lo skip (principale su
    // Crunchyroll/Paramount+, di riserva altrove): passa anch'esso da
    // attemptSkipClick, quindi condivide lo stesso raffreddamento minimo e
    // lo stesso rilevamento loop di un click generato da selettore tecnico
    // (vedi il commento "IMPORTANTE" nella documentazione sopra sul perché
    // questo è necessario). fallbackIntervalMs resta un limite separato:
    // throttla solo quanto spesso si RICERCA (querySelectorAll su tutta la
    // pagina), non quanto spesso si CLICCA, di cui si occupa già
    // attemptSkipClick.
    const fallbackKeys = config.fallbackSettingKeys || [];
    if (fallbackKeys.some((key) => settings[key]) && nowTick - lastFallbackAt >= fallbackIntervalMs) {
      lastFallbackAt = nowTick;
      const fallback = skippyFindFallbackButton(container);
      if (fallback) attemptSkipClick(fallback, nowTick, pos);
    }
  }

  // Unisce eventuali raffiche di mutazioni ravvicinate in un solo tick, così
  // il costo resta minimo anche quando il player aggiorna frequentemente il
  // DOM (es. contatore del tempo), pur reagendo entro un singolo frame.
  function scheduleTick() {
    if (scheduled) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      tick();
    };
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(run);
    } else {
      setTimeout(run, 0);
    }
  }

  // Riaggancia il MutationObserver al contenitore del player quando
  // disponibile (ambito ristretto, economico), oppure all'intero documento
  // finché il contenitore non esiste ancora o non è più lo stesso elemento
  // (es. cambio episodio su Netflix, dove ".watch-video" viene ricreato).
  function rescopeObserver(container) {
    const target = container || document.documentElement;
    if (observedTarget === target) return;
    if (observer) observer.disconnect();
    observer = new MutationObserver(scheduleTick);
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'disabled']
    });
    observedTarget = target;
  }

  rescopeObserver(null);
  tick();
  setInterval(tick, intervalMs);
}
