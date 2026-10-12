/*
 * amazon.js
 * Configurazione di Skippy per Amazon Prime Video: sigla, recap, crediti ed
 * episodio successivo.
 *
 * Il player web di Prime Video ("atvwebplayersdk") usa una classe CSS
 * stabile e indipendente dalla lingua per qualunque pulsante di skip
 * mostrato in quel momento (sigla, recap o crediti), quindi un unico
 * selettore copre tutti i casi in qualunque lingua sia impostata
 * l'interfaccia di Amazon.
 *
 * "#dv-web-player" è il contenitore del player: è lo stesso selettore usato
 * dal codice sorgente ufficiale di Firefox (video-wrapper Picture-in-Picture
 * per Prime Video) per individuarlo, quindi è un riferimento stabile.
 * Poiché il content script gira su tutto il dominio Amazon (pagine prodotto
 * comprese, non solo la riproduzione), questo controllo serve anche da
 * guardia per non fare nulla fuori dal player. La logica del ciclo vera e
 * propria è condivisa con Netflix e vive in core.js.
 *
 * Nota v1.7.0 sull'episodio successivo: oltre al selettore tecnico della
 * "next up card", sono stati aggiunti un paio di varianti (il pulsante può
 * comparire come elemento diretto con classe "-button" oppure annidato in
 * un link/ruolo "button" dentro il wrapper della card, a seconda della
 * build del player) e un ripiego testuale multilingua
 * (SKIPPY_NEXT_FALLBACK_PHRASES, definito in core.js) per i casi in cui
 * nessuna delle varianti tecniche corrisponda più. Anche l'apparente "non
 * fa nulla" segnalato per questa funzione aveva però un'altra causa,
 * indipendente dal selettore: vedi il commento su isNextEpisodeReady in
 * core.js.
 */

(function () {
  skippyCreateAutoSkipLoop({
    getContainer: () => document.getElementById('dv-web-player'),
    actions: [
      {
        settingKey: 'skipIntro',
        // Copre "Salta sigla", "Salta riassunto" e "Salta crediti": Prime
        // Video riusa la stessa classe per qualsiasi pulsante di skip attivo.
        selectors: ['.atvwebplayersdk-skipelement-button']
      },
      {
        // kind: 'next' (vedi core.js): la "next up card" di Prime Video
        // compare anch'essa durante i titoli di coda, prima della fine
        // reale dell'episodio; senza una finestra di conferma e un
        // controllo sulla posizione di riproduzione scatterebbe "in
        // anticipo" rispetto a quanto l'utente si aspetta.
        settingKey: 'autoNext',
        selectors: [
          '.atvwebplayersdk-nextupcard-button',
          '.atvwebplayersdk-nextupcard-wrapper button',
          '.atvwebplayersdk-nextupcard-wrapper a',
          '.atvwebplayersdk-nextupcard-wrapper [role="button"]',
          '.atvwebplayersdk-nexttitle-button'
        ],
        kind: 'next',
        fallbackPhrases: SKIPPY_NEXT_FALLBACK_PHRASES
      }
    ],
    fallbackSettingKeys: ['skipIntro']
  });
})();
