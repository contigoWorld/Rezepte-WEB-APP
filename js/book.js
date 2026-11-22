/* Speichert Eingaben (Wochenplan, Einkaufslisten, Vorratsliste) lokal im Browser.
   Felder mit data-persist="…" werden pro Seite gespeichert. */
(function () {
  var page = location.pathname.split('/').pop() || 'index';
  var fields = document.querySelectorAll('[data-persist]');
  Array.prototype.forEach.call(fields, function (el) {
    var key = 'atelier-book:' + page + ':' + el.getAttribute('data-persist');
    try {
      var saved = localStorage.getItem(key);
      if (saved !== null) {
        if (el.type === 'checkbox') { el.checked = saved === '1'; } else { el.value = saved; }
      }
    } catch (e) { /* Speicher nicht verfügbar */ }
    var evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, function () {
      try { localStorage.setItem(key, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value); } catch (e) {}
    });
  });
})();
