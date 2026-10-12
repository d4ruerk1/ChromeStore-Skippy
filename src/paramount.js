/*
 * paramount.js
 * Configurazione di Skippy per Paramount+: sigla/recap/titoli di coda ed
 * episodio successivo.
 *
 * Come per Crunchyroll (vedi commenti in src/crunchyroll.js), anche per
 * Paramount+ non risulta pubblicamente un attributo tecnico stabile e
 * documentato equivalente al "data-uia" di Netflix per il pulsante di
 * salto: le estensioni dedicate esistenti si limitano a descriversi come
 * "ottimizzate per l'interfaccia in inglese", il che conferma che si basano
 * sul testo del pulsante piuttosto che su un hook tecnico.
 *
 * Di conseguenza, anche qui la rete di sicurezza multilingua di core.js
 * (SKIPPY_FALLBACK_PHRASES) è il meccanismo PRINCIPALE con cui viene
 * riconosciuto il pulsante di salto, ricontrollata quasi ad ogni ciclo
 * (fallbackIntervalMs: 150, contro i 400 usati altrove come semplice
 * ripiego) invece che come ripiego secondario; il rilevamento resta comunque
 * guidato dagli eventi tramite il MutationObserver di core.js, quindi in
 * pratica una scansione scatta appena il DOM cambia, non solo ogni 150 ms.
 * Non viene usato nessun selettore tecnico "a indovinare" per il salto (es.
 * basato su attributi generici contenenti "skip"), per lo stesso motivo
 * spiegato per Crunchyroll: il rischio di intercettare per errore altri
 * elementi della pagina (come i link di accessibilità "salta al contenuto")
 * supererebbe il beneficio di un tentativo non verificato.
 *
 * Se in futuro venisse individuato un attributo tecnico stabile per il
 * pulsante di salto di Paramount+, andrebbe aggiunto come selettore
 * primario in una nuova action con settingKey: 'skipIntro' (al momento
 * assente di proposito, per non introdurre un selettore inventato).
 *
 * L'avanzamento episodio resta un tentativo "best-effort" prudente (stessa
 * logica di Crunchyroll: richiede "next" + "episode" insieme nello stesso
 * data-testid) ed è attivo di default come su tutte le altre piattaforme,
 * ma resta disattivabile dal popup in qualunque momento. Dato che la
 * ricerca avviene sull'intera pagina, un elemento con lo stesso pattern
 * potrebbe essere presente ben prima della fine reale dell'episodio: l'azione
 * è quindi marcata `kind: 'next'` (vedi core.js), che richiede una finestra
 * di conferma di visibilità continua e, quando la durata del video è nota,
 * una posizione di riproduzione realmente vicina alla fine prima di
 * cliccare, così da non far scattare l'avanzamento "in anticipo".
 */

(function () {
  skippyCreateAutoSkipLoop({
    getContainer: () => (document.querySelector('video') ? document.body : null),
    actions: [
      {
        settingKey: 'autoNext',
        selectors: ["[data-testid*='next' i][data-testid*='episode' i]"],
        kind: 'next'
      }
    ],
    fallbackSettingKeys: ['skipIntro'],
    fallbackIntervalMs: 150
  });
})();
