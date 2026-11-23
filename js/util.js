/* ==========================================================================
   util.js: small shared helpers (no dependencies)
   ========================================================================== */
(function () {
  'use strict';
  window.PF = window.PF || {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }

  /* Normalise a name so "C++", "c++", "Scikit-learn" and "scikit learn" compare predictably. */
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+#]+/g, ''); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, a); }, ms);
    };
  }

  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function prefersReducedMotion() { return !!reduced.matches; }

  /* ---- dates ---------------------------------------------------------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parseYMD(s) {
    var m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s || '');
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: m[3] ? +m[3] : 1 };
  }
  function fmtMonthYear(s) {
    var p = parseYMD(s);
    return p ? MONTHS[p.m - 1] + ' ' + p.y : '';
  }
  function fmtDate(s) {
    var p = parseYMD(s);
    return p ? p.d + ' ' + MONTHS[p.m - 1] + ' ' + p.y : '';
  }
  /* "YYYY-MM" start, "YYYY-MM" end or null (= now) -> "4 mos" / "1 yr 2 mos" */
  function duration(start, end) {
    var a = parseYMD(start);
    if (!a) return '';
    var b = end ? parseYMD(end) : (function () { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1 }; })();
    var months = (b.y - a.y) * 12 + (b.m - a.m) + 1; // inclusive of both months
    if (months < 1) months = 1;
    var yrs = Math.floor(months / 12), mos = months % 12, out = [];
    if (yrs) out.push(yrs + (yrs === 1 ? ' yr' : ' yrs'));
    if (mos) out.push(mos + (mos === 1 ? ' mo' : ' mos'));
    return out.join(' ');
  }

  function fmtBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  function levelLabel(n) {
    if (n >= 85) return 'Advanced';
    if (n >= 65) return 'Proficient';
    if (n >= 40) return 'Working knowledge';
    return 'Learning';
  }

  /* ---- safe storage --------------------------------------------------- */
  var storage = {
    get: function (k, fallback) {
      try { var v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---- tiny event bus ------------------------------------------------- */
  var handlers = {};
  var bus = {
    on: function (evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    emit: function (evt, data) {
      (handlers[evt] || []).slice().forEach(function (fn) {
        try { fn(data); } catch (e) { console.error('[bus:' + evt + ']', e); }
      });
    }
  };

  /* ---- files ---------------------------------------------------------- */
  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name || 'download';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
        ta.remove();
      } catch (e) { reject(e); }
    });
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* Skill lookup shared by skills.js, certs.js and projects.js */
  function buildSkillIndex() {
    var byId = {}, byNorm = {}, list = [];
    (PF.data.skillCategories || []).forEach(function (cat) {
      cat.skills.forEach(function (sk) {
        sk.category = cat.id;
        byId[sk.id] = sk; list.push(sk);
        byNorm[norm(sk.id)] = sk; byNorm[norm(sk.name)] = sk;
        (sk.aliases || []).forEach(function (a) { byNorm[norm(a)] = byNorm[norm(a)] || sk; });
      });
    });
    return {
      byId: byId, list: list,
      match: function (text) { return byNorm[norm(text)] || null; }
    };
  }

  PF.util = {
    $: $, $$: $$, esc: esc, norm: norm, slug: slug, uid: uid, debounce: debounce,
    prefersReducedMotion: prefersReducedMotion,
    fmtMonthYear: fmtMonthYear, fmtDate: fmtDate, duration: duration, fmtBytes: fmtBytes, levelLabel: levelLabel,
    storage: storage, bus: bus, saveBlob: saveBlob, copyText: copyText, loadScript: loadScript,
    buildSkillIndex: buildSkillIndex, parseYMD: parseYMD
  };
  PF.bus = bus;
})();
