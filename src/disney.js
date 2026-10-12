/*
 * disney.js
 * Configurazione di Skippy per Disney+: sigla/recap/titoli di coda ed
 * episodio successivo.
 *
 * A differenza di Netflix (data-uia) e Prime Video (classe
 * "atvwebplayersdk-..."), per Disney+ non esiste una fonte ufficiale
 * altrettanto autorevole (tipo il codice sorgente di Firefox) che documenti
 * l'attributo tecnico del pulsante di salto. La classe ".skip__button" è
 * però confermata in modo indipendente da più script/estensioni open source
 * dedicati proprio a Disney+ (uno script Tampermonkey mantenuto da anni, un
 * altro script di terze parti con centinaia di installazioni su GreasyFork,
 * e un'estensione multi-piattaforma separata): tutti la usano come selettore
 * per QUALSIASI pulsante di salto mostrato in quel momento (sigla, recap o
 * titoli di coda), esattamente come ".atvwebplayersdk-skipelement-button" fa
 * su Prime Video. Per coerenza è trattata allo stesso modo qui sotto, con un
 * solo interruttore "Salta sigla / recap / crediti".
 *
 * "[data-testid='up-next-play-button']" per l'episodio successivo proviene
 * dalla stessa famiglia di script; essendo un attributo "data-testid" (un
 * hook pensato per restare identico a prescindere dalla lingua, come i
 * "data-uia" di Netflix) lo usiamo come selettore principale.
 *
 * Nota di affidabilità: a differenza di Netflix e Prime Video, qui le fonti
 * sono script di terze parti e non la documentazione ufficiale di un
 * browser: se Disney+ dovesse cambiare questi nomi, la rete di sicurezza
 * multilingua di core.js (SKIPPY_FALLBACK_PHRASES) resta comunque attiva e
 * copre il caso, indipendentemente dalla lingua impostata sull'account.
 */

(function () {
  skippyCreateAutoSkipLoop({
    // Non risulta, per Disney+, un id/classe del contenitore del player
    // confermato da una fonte solida quanto ".watch-video" (Netflix) o
    // "#dv-web-player" (Prime Video, confermato dal codice di Firefox): per
    // restare onesti sulla fonte, qui la "guardia" si limita a verificare
    // che in pagina ci sia un elemento <video> in riproduzione, e in tal
    // caso la ricerca dei pulsanti avviene sull'intera pagina. Il costo resta
    // comunque minimo: se non c'è alcun <video> (home, ricerca, account...)
    // il ciclo esce subito, come su Prime Video.
    getContainer: () => (document.querySelector('video') ? document.body : null),
    actions: [
      {
        settingKey: 'skipIntro',
        selectors: ['.skip__button']
      },
      {
        // kind: 'next' (vedi core.js): stesso motivo di Netflix/Prime Video,
        // la card "a seguire" può comparire prima della fine reale
        // dell'episodio; la conferma di continuità e il controllo sulla
        // posizione di riproduzione evitano che scatti "in anticipo".
        settingKey: 'autoNext',
        selectors: ["[data-testid='up-next-play-button']"],
        kind: 'next',
        // Ripiego testuale multilingua (v1.7.0): qui la ricerca è su tutta
        // la pagina (vedi nota su getContainer sopra), ma la finestra di
        // conferma e il controllo sulla posizione di riproduzione di
        // isNextEpisodeReady restano comunque gli stessi, quindi un
        // eventuale elemento estraneo trovato per errore non verrebbe
        // comunque cliccato "subito".
        fallbackPhrases: SKIPPY_NEXT_FALLBACK_PHRASES
      }
    ],
    fallbackSettingKeys: ['skipIntro']
  });
})();
