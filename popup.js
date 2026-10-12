/*
 * Sezione donazioni.
 * URL della pagina di donazione (PayPal.me).
 */
const SKIPPY_DONATION_URL = 'https://www.paypal.com/paypalme/D4ruerk';

document.addEventListener('DOMContentLoaded', () => {
  // Non c'è più un interruttore generale separato (vedi nota in
  // src/core.js su SKIPPY_DEFAULTS, v1.6.0): tutte le chiavi rimaste in
  // SKIPPY_DEFAULTS corrispondono 1:1 a un interruttore nel popup.
  const ids = Object.keys(SKIPPY_DEFAULTS);

  // Carica le preferenze salvate (o i default) e imposta lo stato di ogni
  // interruttore di conseguenza: le impostazioni vengono lette da
  // chrome.storage.local, quindi restano ricordate tra un'apertura del
  // popup e l'altra, e anche dopo il riavvio del browser.
  skippyGetSettings((settings) => {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!settings[id];
    });
  });

  // Ogni volta che un interruttore cambia, la nuova preferenza viene
  // scritta subito in chrome.storage.local: da qui i content script la
  // leggono (skippyGetSettings) e la osservano in tempo reale
  // (skippyWatchSettings, vedi src/core.js), così i pulsanti di skip
  // restano sempre allineati alle preferenze scelte.
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      chrome.storage.local.set({ [id]: el.checked });
    });
  });

  const donateBtn = document.getElementById('donateBtn');
  if (donateBtn) donateBtn.href = SKIPPY_DONATION_URL;
});
