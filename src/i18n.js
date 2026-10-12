/*
 * i18n.js
 * Localizzazione dell'interfaccia del popup.
 *
 * chrome.i18n sceglie in automatico, tra le lingue disponibili in
 * _locales/ (it, en, fr, es, ru, ar, hi, de), quella più vicina alle
 * lingue preferite del browser dell'utente, con ricaduta su
 * "default_locale" (impostato su "en" in manifest.json) se nessuna
 * corrisponde. Non serve quindi rilevare la lingua "a mano": è lo stesso
 * meccanismo che Chrome/Edge/Brave usano per la propria interfaccia e per
 * qualunque estensione localizzata.
 *
 * Importante: questo file riguarda SOLO il testo del popup (le etichette
 * delle impostazioni, i titoli delle card, ecc.). La lingua scelta qui non
 * ha alcun effetto sulla logica di riconoscimento/salto in src/core.js e
 * nei file di piattaforma: quella si basa su attributi/classi tecnici del
 * sito in riproduzione (o, in ricaduta, su SKIPPY_FALLBACK_PHRASES, che
 * riguarda la lingua dell'INTERFACCIA DI NETFLIX/PRIME VIDEO/ECC., non
 * quella del browser né quella qui applicata al popup: sono due impostazioni
 * indipendenti, per due superfici diverse). Cambiare la lingua del popup non
 * richiede quindi nessuna modifica al funzionamento dell'estensione sui
 * singoli siti, e viceversa.
 */

(function () {
  function localize() {
    if (typeof chrome === 'undefined' || !chrome.i18n) return;

    // Testo: ogni elemento con data-i18n="chiave" riceve
    // chrome.i18n.getMessage("chiave") come contenuto testuale.
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const msg = chrome.i18n.getMessage(key);
      if (msg) el.textContent = msg;
    });

    // Attributi (es. aria-label, title): formato
    // data-i18n-attr="attributo:chiave[,attributo:chiave...]". Non
    // utilizzato al momento da nessun elemento del popup, ma tenuto per
    // coerenza con eventuali aggiunte future (stesso spirito dei commenti
    // "andrebbe aggiunto qui" già presenti nei file di piattaforma).
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        const msg = attr && key ? chrome.i18n.getMessage(key) : '';
        if (attr && msg) el.setAttribute(attr, msg);
      });
    });

    // "@@ui_locale" è un messaggio speciale predefinito di chrome.i18n: NON
    // è la lingua "grezza" del browser, ma quella che Chrome ha già
    // risolto tra le lingue disponibili in _locales/ (con la stessa
    // ricaduta su default_locale descritta sopra). È quindi il valore
    // corretto per l'attributo lang, perché riflette la lingua REALMENTE
    // in uso nel popup in questo momento, non quella preferita ma magari
    // non supportata.
    const uiLocale = chrome.i18n.getMessage('@@ui_locale');
    if (uiLocale) document.documentElement.lang = uiLocale.replace(/_/g, '-');

    // "@@bidi_dir" è un altro messaggio speciale predefinito: restituisce
    // "rtl" per le lingue scritte da destra a sinistra (qui, l'arabo) e
    // "ltr" per tutte le altre. Necessario perché l'arabo, a differenza
    // delle altre lingue supportate, si legge in direzione opposta: senza
    // questo, il popup resterebbe allineato a sinistra anche in arabo.
    const dir = chrome.i18n.getMessage('@@bidi_dir');
    document.documentElement.dir = dir === 'rtl' ? 'rtl' : 'ltr';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', localize);
  } else {
    localize();
  }
})();
