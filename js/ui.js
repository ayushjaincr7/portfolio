/* ==========================================================================
   ui.js: icons, dialogs, toasts, theme switch, navigation
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, $$, esc } = U;

  /* ---- icons ---------------------------------------------------------- */
  function icon(name, size, cls) {
    const body = (window.ICONS || {})[name];
    if (!body) return '';
    size = size || 18;
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  function hydrateIcons(root) {
    $$('i[data-icon]', root || document).forEach(function (el) {
      el.outerHTML = icon(el.dataset.icon, parseInt(el.dataset.size, 10) || 18, el.className);
    });
  }

  /* ---- dialogs (native <dialog>) -------------------------------------- */
  function bindDialog(dlg) {
    if (dlg._bound) return;
    dlg._bound = true;
    let downOnBackdrop = false;
    dlg.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg && downOnBackdrop) { dlg.close(); return; }
      const c = e.target.closest('[data-close]');
      if (c && dlg.contains(c)) dlg.close();
    });
  }
  function openDialog(idOrEl) {
    const dlg = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!dlg) return null;
    bindDialog(dlg);
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  function closeDialog(idOrEl) {
    const dlg = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (dlg && dlg.open) dlg.close();
  }
  function closeAllDialogs() { $$('dialog[open]').forEach(function (d) { d.close(); }); }

  /* Confirm helper: resolves true when the user confirms. */
  function confirmDialog(opts) {
    const dlg = $('#confirmDialog');
    $('#confirmTitle').textContent = opts.title || 'Are you sure?';
    $('#confirmText').textContent = opts.text || '';
    const ok = $('#confirmOk');
    ok.textContent = opts.confirmLabel || 'Delete';
    return new Promise(function (resolve) {
      let done = false;
      function finish(v) {
        if (done) return;
        done = true;
        ok.removeEventListener('click', onOk);
        dlg.removeEventListener('close', onClose);
        if (dlg.open) dlg.close();
        resolve(v);
      }
      function onOk() { finish(true); }
      function onClose() { finish(false); }
      ok.addEventListener('click', onOk);
      dlg.addEventListener('close', onClose);
      openDialog(dlg);
    });
  }

  /* ---- toasts --------------------------------------------------------- */
  function toast(message, type) {
    /* Dialogs live in the top layer, so a toast raised while one is open has to live inside it. */
    const open = $$('dialog[open]');
    const host = open.length ? open[open.length - 1] : document.body;
    let box = host === document.body ? $('#toasts') : host.querySelector(':scope > .toasts');
    if (!box) {
      box = document.createElement('div');
      box.className = 'toasts';
      host.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' is-' + type : '');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = icon(type === 'error' ? 'triangle-alert' : 'circle-check', 18) + '<span>' + esc(message) + '</span>';
    box.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 320);
    }, type === 'error' ? 6000 : 3600);
  }

  /* ---- theme ---------------------------------------------------------- */
  function initTheme() {
    const btn = $('#themeToggle');
    const root = document.documentElement;
    function apply(theme, save) {
      root.setAttribute('data-theme', theme);
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#E9F4FF' : '#0F0B3F');
      if (save) { try { localStorage.setItem('pf.theme', theme); } catch (e) { /* private mode */ } }
      PF.bus.emit('theme', theme);
    }
    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
    });
  }

  /* ---- navigation ----------------------------------------------------- */
  function initNav() {
    const header = $('#siteHeader');
    const menuBtn = $('#menuToggle');
    const links = $('#navLinks');

    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function setMenu(open) {
      links.classList.toggle('is-open', open);
      header.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

    /* highlight the section in view */
    if ('IntersectionObserver' in window) {
      const map = {};
      $$('[data-nav]').forEach(function (a) { map[a.dataset.nav] = a; });
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          Object.keys(map).forEach(function (k) {
            if (k === en.target.id) map[k].setAttribute('aria-current', 'true');
            else map[k].removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { const s = document.getElementById(id); if (s) io.observe(s); });
      const hero = document.getElementById('hero');
      if (hero) new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) Object.keys(map).forEach(function (k) { map[k].removeAttribute('aria-current'); });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* Scroll to a section and focus nothing in particular. */
  function goTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: U.prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  PF.ui = {
    icon, hydrateIcons, open: openDialog, close: closeDialog, closeAll: closeAllDialogs,
    confirm: confirmDialog, toast, initTheme, initNav, goTo
  };
})();
