/* Reine Hilfsfunktionen (ohne DOM): Mengen skalieren, Zeiten erkennen. */
(function (root) {
  'use strict';
  var FR = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
  var NUM = /\d+(?:[.,]\d+)?[½¼¾⅓⅔]?|[½¼¾⅓⅔]/g;

  function parseNum(tok) {
    var m = tok.match(/^(\d+(?:[.,]\d+)?)?([½¼¾⅓⅔])?$/);
    if (!m) { return NaN; }
    var v = m[1] ? parseFloat(m[1].replace(',', '.')) : 0;
    if (m[2]) { v += FR[m[2]]; }
    return v;
  }

  function fmt(x) {
    if (x >= 10) { return String(Math.round(x)); }
    var whole = Math.floor(x + 1e-6);
    var frac = x - whole;
    var steps = [[0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
    var best = null, dist = 1;
    steps.forEach(function (s) { var d = Math.abs(frac - s[0]); if (d < dist) { dist = d; best = s; } });
    if (dist < 0.06) {
      if (best[0] === 1) { whole += 1; }
      if (whole === 0 && best[1] === '') { return '0'; }
      return (whole > 0 ? String(whole) : '') + best[1];
    }
    return (Math.round(x * 10) / 10).toString().replace('.', ',');
  }

  var PAIRS = [['Zehe', 'Zehen'], ['Dose', 'Dosen'], ['Kugel', 'Kugeln'], ['Stange', 'Stangen'], ['Prise', 'Prisen'],
    ['Knolle', 'Knollen'], ['Zitrone', 'Zitronen'], ['Hand', 'Hände'], ['Blatt', 'Blätter'], ['Tasse', 'Tassen'], ['Orange', 'Orangen']];

  function pluralize(s) {
    PAIRS.forEach(function (p) {
      var re = new RegExp('(\\d+(?:[.,]\\d+)?[½¼¾⅓⅔]?|[½¼¾⅓⅔])(\\s+)(' + p[0] + '|' + p[1] + ')(?![A-Za-zäöüÄÖÜß])', 'g');
      s = s.replace(re, function (all, n, sp) {
        var v = parseNum(n);
        return n + sp + (v > 1 ? p[1] : p[0]);
      });
    });
    return s;
  }

  /* Skaliert alle Zahlen einer Mengenangabe, z. B. "2–3 EL" mit Faktor 2 → "4–6 EL" */
  function scaleQty(text, factor) {
    if (!isFinite(factor) || Math.abs(factor - 1) < 1e-9 || /Hauch/.test(text)) { return text; }
    var changed = false;
    var out = text.replace(NUM, function (tok) {
      var v = parseNum(tok);
      if (isNaN(v)) { return tok; }
      changed = true;
      return fmt(v * factor);
    });
    return changed ? pluralize(out) : text;
  }

  /* Findet Zeitangaben im Text: [{label, seconds}] (bei Bereichen die untere Grenze) */
  function findDurations(text) {
    var re = /(\d+)(?:\s*[–-]\s*(\d+))?\s*(Minuten?|Min\.|Stunden?|Std\.)/g;
    var res = [], m;
    while ((m = re.exec(text)) !== null) {
      var hour = /^(Stunde|Std)/.test(m[3]);
      var lo = parseInt(m[1], 10);
      res.push({
        label: m[1] + (m[2] ? '–' + m[2] : '') + (hour ? ' Std.' : ' Min.'),
        seconds: lo * (hour ? 3600 : 60)
      });
    }
    return res;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return h > 0 ? h + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
  }


  /* ---------------- Einkaufsliste: Mengen lesen, summieren, formatieren ---------------- */
  var N1 = '(?:\\d+(?:[.,]\\d+)?[½¼¾⅓⅔]?|[½¼¾⅓⅔])';
  var QRE = new RegExp('^(?:ca\\.|mind\\.)?\\s*(' + N1 + ')(?:\\s*[–-]\\s*(' + N1 + '))?\\s*(.*)$');
  var UNIT_MAP = [
    [/^(hände voll|hand voll|hände|hand|handvoll)$/i, 'Handvoll'], [/^(zehen|zehe)$/i, 'Zehe'], [/^(dosen|dose)$/i, 'Dose'],
    [/^(kugeln|kugel)$/i, 'Kugel'], [/^(stangen|stange)$/i, 'Stange'], [/^(prisen|prise)$/i, 'Prise'],
    [/^(knollen|knolle)$/i, 'Knolle'], [/^(zitronen|zitrone)$/i, 'Zitrone'], [/^(blätter|blatt)$/i, 'Blatt'],
    [/^(tassen|tasse)$/i, 'Tasse'], [/^(limetten|limette)$/i, 'Limette'], [/^(orangen|orange)$/i, 'Orange']
  ];

  function parseQty(q) {
    var t = String(q || '').trim();
    var m = t.match(QRE);
    if (!m) { return { numeric: false, text: t }; }
    var lo = parseNum(m[1]), hi = m[2] ? parseNum(m[2]) : lo;
    var rest = (m[3] || '').trim();
    var unit = rest.replace(/\([^)]*\)/g, '').replace(/\s+nach\s+(Bedarf|Geschmack|Belieben)$/i, '').trim();
    unit = unit.replace(/^(kleine[rn]?|gute[rn]?|große[rn]?|mittelgroße[rn]?)(\s+|$)/i, '').trim();
    UNIT_MAP.forEach(function (u) { if (u[0].test(unit)) { unit = u[1]; } });
    return { numeric: true, lo: lo, hi: hi, unit: unit, text: t };
  }

  function fmtAmount(v, unit) {
    if ((unit === 'g' || unit === 'ml') && v >= 1000) {
      return String(Math.round(v / 100) / 10).replace('.', ',') + (unit === 'g' ? ' kg' : ' l');
    }
    return fmt(v) + (unit ? ' ' + unit : '');
  }

  function fmtSum(lo, hi, unit) {
    var a = fmtAmount(lo, unit);
    var out;
    if (Math.abs(hi - lo) < 1e-9) { out = a; }
    else {
      var b = fmtAmount(hi, unit);
      var ua = a.replace(/^[^\s]*\s?/, ''), ub = b.replace(/^[^\s]*\s?/, '');
      out = (ua === ub && ua) ? a.slice(0, a.length - ua.length - 1) + '–' + b : a + '–' + b;
    }
    return pluralize(out);
  }

  /* entries: [{name, cat, qty, f}] → [{name, cat, text}] (gleiche Namen werden summiert) */
  function aggregate(entries) {
    var groups = {}, order = [];
    entries.forEach(function (e) {
      var key = e.name;
      if (!groups[key]) { groups[key] = { name: e.name, cat: e.cat, sums: {}, sumOrder: [], extras: [] }; order.push(key); }
      var g = groups[key];
      var p = e.noqty ? { numeric: false, text: e.qty } : parseQty(e.qty);
      if (p.numeric) {
        var uk = (p.unit || '').toLowerCase();
        if (!g.sums[uk]) { g.sums[uk] = { lo: 0, hi: 0, unit: p.unit || '' }; g.sumOrder.push(uk); }
        g.sums[uk].lo += p.lo * e.f; g.sums[uk].hi += p.hi * e.f;
      } else if (p.text && g.extras.indexOf(p.text) < 0) { g.extras.push(p.text); }
    });
    return order.map(function (k) {
      var g = groups[k];
      var parts = g.sumOrder.map(function (uk) { var s = g.sums[uk]; return fmtSum(s.lo, s.hi, s.unit); });
      return { name: g.name, cat: g.cat, text: parts.join(' + ') };
    });
  }

  var api = { scaleQty: scaleQty, findDurations: findDurations, fmtTime: fmtTime, fmt: fmt, parseQty: parseQty, aggregate: aggregate };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.BookLib = api;
})(typeof window !== 'undefined' ? window : this);
