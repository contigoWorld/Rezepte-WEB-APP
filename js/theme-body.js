/* Steht direkt hinter <body>: Wer "hell" gewählt hat, sieht auch die dunklen Kapitel hell. Verhindert Aufblitzen. */
(function () {
  try {
    var b = document.body;
    if (b.classList.contains('is-dark')) { b.setAttribute('data-dark-default', '1'); }
    if (localStorage.getItem('atelier-book:theme') === 'light') { b.classList.remove('is-dark'); }
  } catch (e) { /* ohne Speicher: Seitendesign */ }
})();
