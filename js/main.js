/* ==========================================================================
   main.js: boot order. Static shell first (icons, theme, nav, hero), then the
   data-driven sections, then storage-backed parts (skill levels, certificates).
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, $$ } = U;

  const PLACEHOLDER = /your[._-]|YOUR_|example\.com/i;

  /* Fill links, labels and meta tags from data/site.js so there is one place to edit. */
  function applySite() {
    const s = PF.data.site;
    document.title = s.name + ' | ' + s.fullTitle;
    $('#year').textContent = new Date().getFullYear();

    $$('[data-email]').forEach(function (a) { a.href = 'mailto:' + s.email; });
    $$('[data-email-text]').forEach(function (el) { el.textContent = s.email; });
    $$('[data-social]').forEach(function (a) { a.href = s.social[a.dataset.social] || '#'; });
    $$('[data-social-text]').forEach(function (el) {
      el.textContent = (s.social[el.dataset.socialText] || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    });
    $$('[data-resume]').forEach(function (a) { a.href = s.resume; a.setAttribute('download', s.resumeFileName || ''); });

    /* canonical + sharing URLs follow the configured site URL */
    if (s.url && !PLACEHOLDER.test(s.url)) {
      const base = s.url.replace(/\/$/, '');
      const set = function (sel, attr, v) { const el = $(sel); if (el) el.setAttribute(attr, v); };
      set('link[rel="canonical"]', 'href', base + '/');
      set('meta[property="og:url"]', 'content', base + '/');
      set('meta[property="og:image"]', 'content', base + '/assets/og-image.png');
      set('meta[name="twitter:image"]', 'content', base + '/assets/og-image.png');
    }

    /* structured data gets the real profile links once they are filled in */
    try {
      const ld = JSON.parse($('#ldJson').textContent);
      const same = [s.social.github, s.social.linkedin].filter(function (u) { return u && !PLACEHOLDER.test(u); });
      if (same.length) ld.sameAs = same;
      if (s.url && !PLACEHOLDER.test(s.url)) ld.url = s.url;
      $('#ldJson').textContent = JSON.stringify(ld);
    } catch (e) { /* leave the static JSON-LD as is */ }
  }

  async function boot() {
    PF.ui.hydrateIcons();
    PF.ui.initTheme();
    PF.ui.initNav();
    applySite();
    PF.hero.init();
    PF.sections.init();

    const index = U.buildSkillIndex();
    PF.index = index;

    /* Skills and projects come straight from the data files, so they draw immediately.
       Certificates and saved skill levels need storage (IndexedDB or Supabase), so they follow. */
    PF.skills.init({ index: index, levels: {} });
    PF.projects.init({ index: index });
    PF.contact.init();
    PF.github.init();
    $('#certCount').textContent = 'Loading certificates';

    await PF.store.init();
    const results = await Promise.all([PF.store.listCerts(), PF.store.loadLevels()]);
    PF.skills.setLevels(results[1]);
    PF.certs.init({ index: index, certs: results[0] });
    PF.owner.init();

    if (PF.store.error) PF.ui.toast('Some certificates could not be loaded. ' + PF.store.error, 'error');
  }

  boot().catch(function (e) {
    console.error('[boot]', e);
    const main = $('#main');
    if (main) {
      const note = document.createElement('p');
      note.className = 'container';
      note.style.cssText = 'padding:120px 0 40px';
      note.textContent = 'Something went wrong while loading this page. Please refresh. If it keeps happening, email ' + (PF.data.site.email || 'me') + '.';
      main.prepend(note);
    }
  });
})();
