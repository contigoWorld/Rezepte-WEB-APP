/* Atelier for Food: Web-App-Funktionen.
   Favoriten, Portionsrechner, Timer, Abhaken, Suche und Filter, Dark Mode, Offline. */
(function () {
  'use strict';
  var L = window.BookLib;
  var PAGE = location.pathname.split('/').pop() || 'index.html';
  var IS_COVER = PAGE === 'index.html' || PAGE.indexOf('cover-variante') === 0;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function get(k) { try { return localStorage.getItem('atelier-book:' + k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem('atelier-book:' + k, v); } catch (e) { /* ignorieren */ } }
  function del(k) { try { localStorage.removeItem('atelier-book:' + k); } catch (e) { /* ignorieren */ } }

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20.5s-7.3-4.5-9.2-9C1.5 8.300 3.300 5 6.500 5c1.900 0 3.500 1 4.500 2.600C12 6 13.600 5 15.500 5c3.200 0 5 3.300 3.700 6.500-1.900 4.500-7.200 9-7.200 9z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20.5s-7.3-4.5-9.2-9C1.5 8.300 3.300 5 6.500 5c1.900 0 3.500 1 4.500 2.600C12 6 13.600 5 15.500 5c3.200 0 5 3.300 3.700 6.500-1.900 4.500-7.200 9-7.200 9z" fill="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 8h14l-1.200 11H6.200z M9 8V6.500a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M12 9v4.500l3 1.500M9.500 3h5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  };

  /* ---------------------------------------------------------- Hell / Dunkel */
  function effectiveDark() {
    var st = get('theme');
    if (st === 'dark') { return true; }
    return st !== 'light';
  }
  function applyTheme(dark) {
    var de = document.documentElement;
    de.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (document.body.getAttribute('data-dark-default') === '1') { document.body.classList.toggle('is-dark', dark); }
  }
  function initTheme() {
    if (IS_COVER) { return; }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    function paint() {
      var dark = effectiveDark();
      btn.textContent = dark ? 'Hell' : 'Dunkel';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Zur hellen Ansicht wechseln' : 'Zur dunklen Ansicht wechseln');
    }
    btn.addEventListener('click', function () {
      var dark = !effectiveDark();
      set('theme', dark ? 'dark' : 'light');
      applyTheme(dark);
      paint();
    });
    paint();
    document.body.appendChild(btn);
  }

  /* ---------------------------------------------------------- Mobil: Buttons beim Scrollen aus-/einblenden */
  /* Ganz oben immer sichtbar; nach unten scrollen blendet aus, nach oben scrollen wieder ein. */
  function initScrollButtons() {
    var mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
    var last = 0, ticking = false;
    function setAway(away) {
      $$('.book-close, .theme-toggle').forEach(function (b) { b.classList.toggle('is-away', away); });
    }
    function update() {
      ticking = false;
      var y = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
      if (!mq || !mq.matches || y <= 0) { setAway(false); }
      else if (y > last + 4) { setAway(true); }
      else if (y < last - 4) { setAway(false); }
      else { return; }   /* kleine Zuckungen ignorieren */
      last = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    if (mq && mq.addEventListener) { mq.addEventListener('change', update); }
  }

  /* ---------------------------------------------------------- Blättern: Pfeiltasten, Wischen, Cover */
  function link(sel) { var el = $(sel); return el && el.getAttribute('href') ? el.href : null; }
  function neighbours() {
    return {
      prev: link('.page-nav .prev') || link('.cover-compare a[rel="prev"]'),
      next: link('.page-nav .next') || link('.cover-compare a[rel="next"]') || link('.cover__enter')
    };
  }
  function go(url) { if (url) { location.href = url; } }

  function initPaging() {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) { return; }
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { return; }
      var n = neighbours();
      if (e.key === 'ArrowRight') { go(n.next); }
      else if (e.key === 'ArrowLeft') { go(n.prev); }
      else if (e.key === 'Home' && !IS_COVER) { go('index.html'); }
    });
    var sx = 0, sy = 0, st = 0, ok = false;
    document.addEventListener('touchstart', function (e) {
      var t = e.target;
      ok = e.touches.length === 1 && !(t.closest && t.closest('input, textarea, select, button, .timer, .theme-toggle'));
      if (ok) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); }
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (!ok || !e.changedTouches.length) { return; }
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Date.now() - st > 700 || Math.abs(dx) < 70 || Math.abs(dy) > 60 || Math.abs(dx) < Math.abs(dy) * 2) { return; }
      var n = neighbours();
      go(dx < 0 ? n.next : n.prev);
    }, { passive: true });
  }

  function initClose() {
    if (IS_COVER || document.body.classList.contains('is-cover')) { return; }
    var a = document.createElement('a');
    a.className = 'book-close';
    a.href = 'index.html';
    a.textContent = 'Buch schließen';
    a.setAttribute('title', 'Zurück zum Cover');
    document.body.appendChild(a);
  }

  /* ---------------------------------------------------------- Favoriten */
  function favs() { try { return JSON.parse(get('favs') || '[]'); } catch (e) { return []; } }
  function saveFavs(a) { set('favs', JSON.stringify(a)); }

  function initFav(rec) {
    var slug = rec.getAttribute('data-recipe');
    var btn = $('[data-action="fav"]', rec);
    if (!btn) { return; }
    function paint() {
      var on = favs().indexOf(slug) > -1;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.innerHTML = (on ? ICON.heartFill : ICON.heart) + '<span>' + (on ? 'Favorit' : 'Merken') + '</span>';
    }
    btn.addEventListener('click', function () {
      var a = favs(), i = a.indexOf(slug);
      if (i > -1) { a.splice(i, 1); } else { a.push(slug); }
      saveFavs(a);
      paint();
    });
    paint();
  }

  /* ---------------------------------------------------------- Einkaufsliste */
  var CATS = ['Obst & Gemüse', 'Frische & Kühlregal', 'Tiefkühl', 'Vorrat & Gewürze'];
  function shopSlugs() { try { return JSON.parse(get('shop') || '[]'); } catch (e) { return []; } }
  function saveShop(a) { set('shop', JSON.stringify(a)); }

  function initShopButton(rec) {
    var slug = rec.getAttribute('data-recipe');
    var btn = $('[data-action="shop"]', rec);
    var lnk = $('[data-shop-link]', rec);
    if (!btn) { return; }
    function paint() {
      var on = shopSlugs().indexOf(slug) > -1;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.innerHTML = ICON.cart + '<span>' + (on ? 'Auf der Liste' : 'Einkaufsliste') + '</span>';
      if (lnk) { lnk.hidden = !on; }
    }
    btn.addEventListener('click', function () {
      var a = shopSlugs(), i = a.indexOf(slug);
      if (i > -1) { a.splice(i, 1); } else { a.push(slug); }
      saveShop(a);
      paint();
    });
    paint();
  }

  function initShopList() {
    var root = $('[data-shoplist]');
    var data = window.BOOK_RECIPES;
    if (!root || !data) { return; }
    var rlist = $('[data-rlist]', root), groups = $('[data-groups]', root), empty = $('[data-empty]', root), count = $('[data-count]', root);

    function factor(slug) {
      var r = data[slug];
      if (!r || !r.base) { return 1; }
      var n = parseInt(get('portions:' + slug), 10);
      return n > 0 ? n / r.base : 1;
    }

    function renderItems() {
      var slugs = shopSlugs().filter(function (s) { return data[s]; });
      var entries = [];
      slugs.forEach(function (s) {
        data[s].items.forEach(function (it) { entries.push({ name: it.n, cat: it.c, qty: it.q, f: factor(s), noqty: !!it.x }); });
      });
      var agg = L.aggregate(entries);
      groups.innerHTML = '';
      empty.hidden = slugs.length > 0;
      CATS.forEach(function (cat) {
        var list = agg.filter(function (x) { return x.cat === cat; });
        if (!list.length) { return; }
        list.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
        var sec = document.createElement('section');
        sec.className = 'shoplist__group';
        var h = document.createElement('h2');
        h.className = 'shoplist__h';
        h.textContent = cat;
        var ul = document.createElement('ul');
        list.forEach(function (x) {
          var li = document.createElement('li');
          var lab = document.createElement('label');
          lab.className = 'check';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          var key = 'shopchk:' + x.name;
          cb.checked = get(key) === '1';
          cb.addEventListener('change', function () { set(key, cb.checked ? '1' : '0'); });
          var sp = document.createElement('span');
          sp.appendChild(document.createTextNode(x.name));
          if (x.text) {
            var em = document.createElement('em');
            em.textContent = x.text;
            sp.appendChild(document.createTextNode(' '));
            sp.appendChild(em);
          }
          lab.appendChild(cb); lab.appendChild(sp); li.appendChild(lab); ul.appendChild(li);
        });
        sec.appendChild(h); sec.appendChild(ul); groups.appendChild(sec);
      });
    }

    function renderRecipes() {
      var slugs = shopSlugs().filter(function (s) { return data[s]; });
      count.textContent = '(' + slugs.length + ')';
      rlist.innerHTML = '';
      slugs.forEach(function (s) {
        var r = data[s];
        var li = document.createElement('li');
        var name = document.createElement('a');
        name.href = 'rezept-' + s + '.html';
        name.textContent = r.t;
        li.appendChild(name);
        if (r.base) {
          var wrap = document.createElement('span');
          wrap.className = 'portions';
          var lab = document.createElement('label');
          lab.textContent = r.label;
          lab.setAttribute('for', 'sp-' + s);
          var rng = document.createElement('input');
          rng.type = 'range'; rng.id = 'sp-' + s; rng.min = 1; rng.max = Math.max(8, r.base * 2); rng.step = 1;
          var cur = parseInt(get('portions:' + s), 10);
          rng.value = cur > 0 ? cur : r.base;
          var out = document.createElement('output');
          out.textContent = rng.value;
          rng.addEventListener('input', function () { out.textContent = rng.value; set('portions:' + s, rng.value); renderItems(); });
          wrap.appendChild(lab); wrap.appendChild(rng); wrap.appendChild(out);
          li.appendChild(wrap);
        }
        var rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'chip'; rm.textContent = 'Entfernen';
        rm.addEventListener('click', function () {
          saveShop(shopSlugs().filter(function (x) { return x !== s; }));
          renderRecipes(); renderItems();
        });
        li.appendChild(rm);
        rlist.appendChild(li);
      });
    }

    $('[data-action="clear"]', root).addEventListener('click', function () {
      if (shopSlugs().length && !window.confirm('Einkaufsliste leeren?')) { return; }
      saveShop([]); renderRecipes(); renderItems();
    });
    $('[data-action="uncheck"]', root).addEventListener('click', function () {
      try {
        Object.keys(localStorage).forEach(function (k) { if (k.indexOf('atelier-book:shopchk:') === 0) { localStorage.removeItem(k); } });
      } catch (e) { /* ignorieren */ }
      renderItems();
    });
    window.addEventListener('storage', function () { renderRecipes(); renderItems(); });
    renderRecipes();
    renderItems();
  }

  /* ---------------------------------------------------------- Reiter (Philosophie) */
  function initTabs() {
    var tl = $('[role="tablist"]');
    if (!tl) { return; }
    var tabs = $$('[role="tab"]', tl);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
        panels[j].hidden = j !== i;
      });
      if (focus) { tabs[i].focus(); }
      try { history.replaceState(null, '', '#' + tabs[i].id.replace('tab-', '')); } catch (e) { /* ignorieren */ }
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { select(i, false); }); });
    tl.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) { return; }
      var n = null;
      if (e.key === 'ArrowRight') { n = (i + 1) % tabs.length; }
      else if (e.key === 'ArrowLeft') { n = (i + tabs.length - 1) % tabs.length; }
      else if (e.key === 'Home') { n = 0; }
      else if (e.key === 'End') { n = tabs.length - 1; }
      if (n !== null) { e.preventDefault(); select(n, true); }
    });
    var start = 0, h = (location.hash || '').replace('#', '');
    tabs.forEach(function (t, i) { if (t.id === 'tab-' + h) { start = i; } });
    select(start, false);
  }

  /* ---------------------------------------------------------- Portionsrechner */
  function initPortions(rec) {
    var rng = $('.portions input[type="range"]', rec);
    if (!rng) { return; }
    var slug = rec.getAttribute('data-recipe');
    var base = parseFloat(rec.getAttribute('data-base'));
    var label = rec.getAttribute('data-label') || 'Portionen';
    var out = $('.portions output', rec);
    var cells = [];
    $$('.elements li', rec).forEach(function (li) {
      var sp = li.querySelectorAll(':scope > span');
      if (sp.length < 2) { return; }
      var q = sp[sp.length - 1];
      q.setAttribute('data-orig', q.textContent);
      cells.push(q);
    });
    $$('.check em', rec).forEach(function (q) {   /* Einkaufslisten */
      q.setAttribute('data-orig', q.textContent);
      cells.push(q);
    });
    function apply(n) {
      out.textContent = n;
      rng.setAttribute('aria-valuetext', n + ' ' + label);
      cells.forEach(function (q) { q.textContent = L.scaleQty(q.getAttribute('data-orig'), n / base); });
    }
    rng.addEventListener('input', function () { apply(parseInt(rng.value, 10)); set('portions:' + slug, rng.value); });
    var saved = parseInt(get('portions:' + slug), 10);
    if (saved >= parseInt(rng.min, 10) && saved <= parseInt(rng.max, 10)) { rng.value = saved; }
    apply(parseInt(rng.value, 10));
  }

  /* ---------------------------------------------------------- Zutaten abhaken */
  function initChecks(rec) {
    $$('.elements li', rec).forEach(function (li, i) {
      if (li.classList.contains('elements__sub') || li.querySelectorAll(':scope > span').length < 2) { return; }
      var key = 'check:' + PAGE + ':' + i;
      li.classList.add('is-tick');
      li.setAttribute('role', 'checkbox');
      li.setAttribute('tabindex', '0');
      function paint(on) { li.classList.toggle('is-checked', on); li.setAttribute('aria-checked', on ? 'true' : 'false'); }
      function toggle() { var on = !li.classList.contains('is-checked'); paint(on); set(key, on ? '1' : '0'); }
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
      paint(get(key) === '1');
    });
  }

  /* ---------------------------------------------------------- Timer */
  var timer = { end: 0, label: '', iv: null, el: null, done: false };

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { return; }
      var ctx = new Ctx(), t = ctx.currentTime;
      [0, 0.45, 0.9].forEach(function (d) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.35);
        o.start(t + d); o.stop(t + d + 0.4);
      });
    } catch (e) { /* kein Ton möglich */ }
    try { if (navigator.vibrate) { navigator.vibrate([300, 150, 300]); } } catch (e) { /* ignorieren */ }
  }

  function ensureTimerEl() {
    if (timer.el) { return timer.el; }
    var el = document.createElement('div');
    el.className = 'timer';
    el.setAttribute('role', 'timer');
    el.innerHTML = '<span class="timer__label"></span><span class="timer__time" aria-live="off"></span>' +
      '<button type="button" class="timer__btn" data-act="plus">+1 Min.</button>' +
      '<button type="button" class="timer__btn" data-act="stop">Beenden</button>' +
      '<span class="timer__status" role="status" aria-live="assertive"></span>';
    el.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'stop') { stopTimer(); }
      if (act === 'plus') { timer.end += 60000; timer.done = false; persistTimer(); tick(); }
    });
    document.body.appendChild(el);
    timer.el = el;
    return el;
  }

  function persistTimer() { set('timer', JSON.stringify({ end: timer.end, label: timer.label })); }

  function tick() {
    var el = ensureTimerEl();
    var left = (timer.end - Date.now()) / 1000;
    $('.timer__label', el).textContent = timer.label;
    if (left <= 0) {
      $('.timer__time', el).textContent = 'Fertig';
      el.classList.add('is-done');
      if (!timer.done) {
        timer.done = true;
        $('.timer__status', el).textContent = 'Timer abgelaufen: ' + timer.label;
        beep();
      }
    } else {
      el.classList.remove('is-done');
      $('.timer__status', el).textContent = '';
      $('.timer__time', el).textContent = L.fmtTime(left);
    }
  }

  function startTimer(label, seconds) {
    timer.label = label; timer.end = Date.now() + seconds * 1000; timer.done = false;
    persistTimer();
    ensureTimerEl();
    if (timer.iv) { clearInterval(timer.iv); }
    timer.iv = setInterval(tick, 500);
    tick();
  }

  function stopTimer() {
    if (timer.iv) { clearInterval(timer.iv); timer.iv = null; }
    if (timer.el) { timer.el.parentNode.removeChild(timer.el); timer.el = null; }
    timer.end = 0; del('timer');
  }

  function restoreTimer() {
    try {
      var t = JSON.parse(get('timer') || 'null');
      if (t && t.end && t.end > Date.now() - 600000) {
        timer.label = t.label; timer.end = t.end; timer.done = t.end <= Date.now();
        ensureTimerEl();
        timer.iv = setInterval(tick, 500);
        tick();
      } else if (t) { del('timer'); }
    } catch (e) { /* ignorieren */ }
  }

  function initTimers(rec) {
    $$('.ritual li', rec).forEach(function (li) {
      var body = li.querySelector('span:last-child');
      if (!body) { return; }
      var found = L.findDurations(body.textContent);
      if (!found.length) { return; }
      var wrap = document.createElement('span');
      wrap.className = 'timer-row';
      found.forEach(function (d) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'timer-btn';
        b.innerHTML = ICON.clock + '<span>Timer ' + d.label + '</span>';
        b.setAttribute('aria-label', 'Timer für ' + d.label + ' starten');
        b.addEventListener('click', function () {
          var step = (li.querySelector('strong') || {}).textContent || 'Rezept';
          startTimer(step.replace(/:$/, '') + ' · ' + d.label, d.seconds);
        });
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
    });
  }

  /* ---------------------------------------------------------- Suche und Filter */
  function initFilter() {
    var box = $('.filter');
    if (!box) { return; }
    var input = $('input[type="search"]', box);
    var chips = $$('.chip', box);
    var count = $('.filter__count', box);
    var items = $$('.recipe-list li');
    var active = 'alle';
    var fav = favs();
    items.forEach(function (li) {
      var slug = li.getAttribute('data-slug');
      if (slug && fav.indexOf(slug) > -1) {
        var m = document.createElement('span');
        m.className = 'fav-mark'; m.innerHTML = ICON.heartFill; m.setAttribute('aria-label', 'Favorit');
        li.querySelector('a').appendChild(m);
      }
    });
    function run() {
      var q = (input.value || '').toLowerCase().trim();
      var shown = 0;
      items.forEach(function (li) {
        var slug = li.getAttribute('data-slug');
        var tags = (li.getAttribute('data-tags') || '').split(' ');
        var hay = (li.getAttribute('data-search') || li.textContent).toLowerCase();
        var ok = true;
        if (active === 'favoriten') { ok = !!slug && fav.indexOf(slug) > -1; }
        else if (active !== 'alle') { ok = tags.indexOf(active) > -1; }
        if (ok && q) { ok = hay.indexOf(q) > -1; }
        li.hidden = !ok;
        if (ok && slug && !li.hasAttribute('data-editorial')) { shown += 1; }
      });
      $$('.kn-section').forEach(function (sec) {
        var any = $$('li', sec).some(function (li) { return !li.hidden; });
        sec.hidden = !any;
      });
      if (count) {
        count.textContent = shown + (shown === 1 ? ' Rezept' : ' Rezepte');
        if (active === 'favoriten' && shown === 0) { count.textContent = 'Noch keine Favoriten. Tippe auf einer Rezeptseite auf „Merken“.'; }
      }
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        active = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); x.classList.toggle('is-active', x === c); });
        run();
      });
    });
    input.addEventListener('input', run);
    run();
  }

  /* ---------------------------------------------------------- Start */
  function init() {
    initTheme();
    initClose();
    initScrollButtons();
    initPaging();
    var rec = $('[data-recipe]');
    if (rec && rec.classList.contains('split__body')) { initFav(rec); initShopButton(rec); initChecks(rec); initTimers(rec); }
    initShopList();
    initTabs();
    $$('[data-recipe]').forEach(function (r) { initPortions(r); });
    initFilter();
    restoreTimer();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* Offline-Modus nicht verfügbar */ });
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
