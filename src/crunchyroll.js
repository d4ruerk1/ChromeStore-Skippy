/*
 * crunchyroll.js
 * Configurazione di Skippy per Crunchyroll: sigla/recap/titoli di coda ed
 * episodio successivo.
 *
 * A differenza di Netflix, Prime Video e Disney+, per Crunchyroll NON
 * risulta un singolo attributo tecnico stabile e documentato equivalente a
 * "data-uia" per il pulsante di salto. Più progetti open source dedicati
 * proprio a Crunchyroll (script Tampermonkey e estensioni Chrome separate,
 * mantenuti attivamente da autori diversi) risolvono il problema cercando il
 * pulsante tramite il testo visibile, l'aria-label o il titolo, non tramite
 * un singolo selettore tecnico fisso: segno che Crunchyroll non espone un
 * hook stabile quanto quello di Netflix, o che comunque non è pubblicamente
 * noto. Il player espone comunque attributi "data-testid" con prefisso
 * "vilos-" per altri controlli (play/pausa, etichetta pubblicità): non è
 * però possibile confermare, senza accesso diretto e continuo al player, che
 * lo stesso valga per il pulsante di salto con un nome prevedibile, quindi
 * qui non viene usato nessun tentativo "a indovinare" basato su attributi
 * generici (rischierebbe di intercettare per errore altri elementi della
 * pagina, come i link di accessibilità "salta al contenuto" che contengono
 * anch'essi la parola "skip").
 *
 * Per questo motivo, su Crunchyroll la rete di sicurezza multilingua di
 * core.js (SKIPPY_FALLBACK_PHRASES, frasi complete tipo "salta sigla"/"skip
 * intro" in una ventina di lingue) non è qui un ripiego secondario come su
 * Netflix e Prime Video, ma il meccanismo PRINCIPALE: viene ricontrollata
 * quasi ad ogni ciclo (fallbackIntervalMs: 150, contro i 400 usati altrove
 * come semplice ripiego) proprio perché è la strada più affidabile oggi
 * individuabile pubblicamente, ed è anche quella storicamente più esposta al
 * rischio di "skip in ritardo" se controllata con troppa parsimonia. Il
 * rilevamento resta comunque guidato dagli eventi tramite il
 * MutationObserver di core.js: l'intervallo qui indicato è solo il limite
 * massimo tra due scansioni, non l'unico momento in cui una scansione può
 * scattare. Se in futuro qualcuno individuasse un attributo tecnico stabile
 * per il pulsante di salto di Crunchyroll, andrebbe aggiunto qui come
 * selettore primario in una nuova action con settingKey: 'skipIntro' (al
 * momento assente di proposito).
 *
 * L'avanzamento episodio è invece un tentativo "best-effort" volutamente
 * prudente: richiede la compresenza di "next" ED "episode" nello stesso
 * data-testid, proprio per ridurre il rischio di intercettare elementi non
 * player (es. anteprime "up next" nella pagina). Come su tutte le altre
 * piattaforme è attivo di default, ma resta disattivabile dal popup in
 * qualunque momento.
 *
 * Proprio perché qui la ricerca del pulsante avviene sull'intera pagina (non
 * dentro un contenitore player ristretto, per i motivi spiegati sopra), il
 * rischio concreto di questo selettore generico non è tanto un falso
 * positivo isolato, quanto un elemento con lo stesso pattern di attributi
 * presente in pagina fin dall'inizio della riproduzione (es. un
 * suggerimento "prossimo episodio" in una lista laterale), che farebbe
 * scattare l'avanzamento "in anticipo", ben prima della fine reale
 * dell'episodio in corso. Per questo l'azione è marcata `kind: 'next'`
 * (vedi core.js): scatta solo dopo una finestra di conferma di visibilità
 * continua e, quando la durata del video è nota, solo se la riproduzione è
 * realmente vicina alla fine.
 *
 * Nota tecnica: il player di Crunchyroll può essere incorporato in un iframe
 * ospitato su static.crunchyroll.com (dominio comunque coperto dal pattern
 * "*://*.crunchyroll.com/*" in manifest.json). Per questo il content script
 * è registrato con "all_frames": true, così da girare anche dentro
 * quell'iframe e non solo nella pagina principale.
 */

(function () {
  skippyCreateAutoSkipLoop({
    getContainer: () => (document.querySelector('video') ? document.body : null),
    actions: [
      {
        // Tentativo best-effort e prudente: richiede "next" + "episode"
        // insieme nello stesso attributo, per restare gratuito senza
        // rischiare falsi positivi altrove in pagina. kind: 'next' (vedi
        // core.js e il commento in testa al file) evita che scatti "in
        // anticipo" se l'elemento è presente in pagina ben prima della fine
        // reale dell'episodio.
        settingKey: 'autoNext',
        selectors: ["[data-testid*='next' i][data-testid*='episode' i]"],
        kind: 'next'
      }
    ],
    fallbackSettingKeys: ['skipIntro'],
    fallbackIntervalMs: 150
  });
})();
