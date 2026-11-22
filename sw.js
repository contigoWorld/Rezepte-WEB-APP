/* Service Worker: Offline-Modus. CORE = alle Seiten, CSS/JS, Icons und genutzte Bilder (Stand 19.11.2026). */
const VERSION = 'atelier-book-20261121-v57-inhalt';
const CORE = [
 "./",
 "./index.html",
 "./abschluss.html",
 "./anleitung.html",
 "./bonus-einkaufsliste.html",
 "./bonus-lexikon.html",
 "./bonus-vorratsliste.html",
 "./bonus-wochenplan.html",
 "./bonus-wochenritual.html",
 "./impressum.html",
 "./inhalt.html",
 "./kapitel-1.html",
 "./kapitel-2.html",
 "./kapitel-3.html",
 "./kapitel-4.html",
 "./motto.html",
 "./philosophie.html",
 "./rezept-brokkolisalat.html",
 "./rezept-brombeer-rote-bete-drink.html",
 "./rezept-comfort-soup.html",
 "./rezept-farinata.html",
 "./rezept-gefuellte-zucchini.html",
 "./rezept-gnudi.html",
 "./rezept-green-longevity.html",
 "./rezept-kalettes-salat.html",
 "./rezept-karotten-fenchel-salat.html",
 "./rezept-kohlrabi-asia-salat.html",
 "./rezept-kohlrabi-suesskartoffel-curry.html",
 "./rezept-linsen-dal.html",
 "./rezept-longevity-confection.html",
 "./rezept-ofen-rosenkohl.html",
 "./rezept-parmigiana-beluga.html",
 "./rezept-purpur-salat.html",
 "./rezept-quinoa-bowl.html",
 "./rezept-radicchio-fenchel.html",
 "./rezept-raspberry-bliss.html",
 "./rezept-roja.html",
 "./rezept-rosso-mediterraneo.html",
 "./rezept-rote-bete-gulasch.html",
 "./rezept-spicy-karottensuppe.html",
 "./rezept-suppe-hundertjaehrige.html",
 "./rezept-tomatentatar.html",
 "./rezept-white-slaw.html",
 "./vorwort.html",
 "./wissen-hebel.html",
 "./wissen-koerper.html",
 "./wissen-longevity.html",
 "./wissen-mahlzeit-aufbauen.html",
 "./css/design-system.css",
 "./fonts/cormorant-garamond-normal-300.woff2",
 "./fonts/fonts.css",
 "./fonts/great-vibes-normal-400.woff2",
 "./fonts/montserrat-italic-300.woff2",
 "./fonts/montserrat-normal-300.woff2",
 "./js/app.js",
 "./js/book.js",
 "./js/lib.js",
 "./js/recipes-data.js",
 "./js/theme-body.js",
 "./js/theme.js",
 "./manifest.webmanifest",
 "./icons/favicon.svg",
 "./icons/icon-180.png",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./images/abschluss-terrasse.jpg",
 "./images/cover.jpg",
 "./images/kapitel-1.jpg",
 "./images/kapitel-2.jpg",
 "./images/kapitel-3.jpg",
 "./images/kapitel-4.jpg",
 "./images/rezept-brokkolisalat.jpg",
 "./images/rezept-brombeer-rote-bete-drink.jpg",
 "./images/rezept-comfort-soup.jpg",
 "./images/rezept-gefuellte-zucchini.jpg",
 "./images/rezept-gnudi.jpg",
 "./images/rezept-green-longevity.jpg",
 "./images/rezept-kalettes-salat.jpg",
 "./images/rezept-karotten-fenchel-salat.jpg",
 "./images/rezept-kohlrabi-asia-salat.jpg",
 "./images/rezept-kohlrabi-suesskartoffel-curry.jpg",
 "./images/rezept-ligurische-farinata.jpg",
 "./images/rezept-linsen-dal.jpg",
 "./images/rezept-longevity-confection.jpg",
 "./images/rezept-ofen-rosenkohl.jpg",
 "./images/rezept-parmigiana-beluga.jpg",
 "./images/rezept-purpur-salat.jpg",
 "./images/rezept-quinoa-bowl.jpg",
 "./images/rezept-radicchio-fenchel.jpg",
 "./images/rezept-raspberry-bliss.jpg",
 "./images/rezept-roja.jpg",
 "./images/rezept-rosso-mediterraneo.jpg",
 "./images/rezept-rote-bete-gulasch.jpg",
 "./images/rezept-spicy-karottensuppe.jpg",
 "./images/rezept-suppe.jpg",
 "./images/rezept-tomatentatar.jpg",
 "./images/rezept-white-slaw.jpg",
 "./images/thumb-brombeer-rote-bete-drink.jpg",
 "./images/thumb-comfort-soup.jpg",
 "./images/thumb-gefuellte-zucchini.jpg",
 "./images/thumb-gnudi.jpg",
 "./images/thumb-kalettes-salat.jpg",
 "./images/thumb-karotten-fenchel-salat.jpg",
 "./images/thumb-kohlrabi-asia-salat.jpg",
 "./images/thumb-kohlrabi-suesskartoffel-curry.jpg",
 "./images/thumb-ligurische-farinata.jpg",
 "./images/thumb-linsen-dal.jpg",
 "./images/thumb-longevity-confection.jpg",
 "./images/thumb-ofen-rosenkohl.jpg",
 "./images/thumb-parmigiana-beluga.jpg",
 "./images/thumb-purpur-salat.jpg",
 "./images/thumb-radicchio-fenchel.jpg",
 "./images/thumb-raspberry-bliss.jpg",
 "./images/thumb-rosso-mediterraneo.jpg",
 "./images/thumb-rote-bete-gulasch.jpg",
 "./images/thumb-spicy-karottensuppe.jpg",
 "./images/thumb-white-slaw.jpg",
 "./images/vorwort-fenster.jpg",
 "./images/vorwort-garten.jpg",
 "./images/vorwort-kueche.jpg",
 "./images/wissen-koerper.jpg",
 "./images/wissen-longevity.jpg"
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
