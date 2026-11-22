/* Wird im <head> geladen: merkt sich die Wahl (hell/dunkel). Das Cover bleibt immer dunkel gestaltet. */
(function () {
  try {
    var name = location.pathname.split('/').pop();
    if (name === '' || name === 'index.html' || name.indexOf('cover-variante') === 0) { document.documentElement.style.backgroundColor = '#121212'; return; }
    var t = localStorage.getItem('atelier-book:theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch (e) { /* ohne Speicher: Seitendesign */ }
})();
