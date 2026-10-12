/*
 * netflix.js
 * Configurazione di Skippy per Netflix: sigla/intro, recap ed episodio
 * successivo.
 *
 * Netflix espone questi pulsanti tramite attributi tecnici "data-uia" che
 * NON cambiano al variare della lingua dell'interfaccia (sono hook interni
 * usati anche dai test automatici di Netflix), quindi funzionano identici
 * in italiano, inglese, giapponese, ecc. Confermato attivo e aggiornato da
 * più fonti indipendenti (script pubblici, estensioni open source
 * attivamente mantenute).
 *
 * Il contenitore del player (".watch-video") è confermato dal codice
 * sorgente ufficiale di Firefox (video-wrapper Picture-in-Picture per
 * Netflix), quindi è un riferimento stabile su cui fare da guardia prima
 * di eseguire qualunque controllo. La logica del ciclo vera e propria è
 * condivisa con Prime Video e vive in core.js.
 */

(function () {
  skippyCreateAutoSkipLoop({
    getContainer: () => document.querySelector('.watch-video'),
    actions: [
      {
        // Stesso interruttore "skipIntro" della action successiva: sigla e
        // recap sono due pulsanti tecnicamente distinti su Netflix, ma dal
        // popup sono controllati insieme da un solo interruttore condiviso
        // con tutte le altre piattaforme.
        settingKey: 'skipIntro',
        // "Salta sigla" (schermata pre-episodio), "Salta intro" in-player,
        // e variante generica usata in alcune build del player Netflix.
        selectors: [
          '[data-uia="player-skip-intro"]',
          '.watch-video--skip-preplay-button',
          '.watch-video--skip-content-button'
        ]
      },
      {
        settingKey: 'skipIntro',
        selectors: ['[data-uia="player-skip-recap"]']
      },
      {
        // kind: 'next' (vedi core.js): il pulsante "prossimo episodio"
        // compare mentre l'episodio attuale sta ancora scorrendo (durante i
        // titoli di coda), spesso con largo anticipo sulla fine reale.
        // Cliccarlo appena individuato lo farebbe scattare "in anticipo",
        // interrompendo l'episodio prima del previsto: core.js richiede
        // quindi che resti visibile con continuità per una breve finestra
        // di conferma e, quando la durata del video è nota, che si sia
        // realmente vicini alla fine prima di cliccarlo.
        settingKey: 'autoNext',
        selectors: ['[data-uia="next-episode-seamless-button"]'],
        kind: 'next',
        // Ripiego testuale multilingua (v1.7.0): rete di sicurezza nel caso
        // Netflix cambi in futuro questo attributo data-uia, coerente con
        // quanto già fatto per Prime Video.
        fallbackPhrases: SKIPPY_NEXT_FALLBACK_PHRASES
      }
    ],
    fallbackSettingKeys: ['skipIntro']
  });
})();
