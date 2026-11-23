/* ==========================================================================
   projects.js: project grid, technology filter, workflow diagram, detail modal.
   Add a project by adding one object to data/projects.js; nothing here changes.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, $$, esc } = U;
  const ic = function (n, s, c) { return PF.ui.icon(n, s, c); };

  const HUES = { violet: 262, blue: 218, cyan: 190, indigo: 240, teal: 165, rose: 335 };
  const VISIBLE_FILTERS = 8;

  let projects = [];
  let index = null;
  let activeTech = 'all';
  let showAllTech = false;

  const hue = function (p) { return typeof p.hue === 'number' ? p.hue : (HUES[p.hue] != null ? HUES[p.hue] : 250); };
  const safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };
  const byId = function (id) { return projects.filter(function (p) { return p.id === id; })[0]; };

  /* A small workflow drawing built from the project's `flow` steps. */
  function diagram(p) {
    const steps = p.flow || [];
    if (steps.length < 2) return '<span class="plate-icon">' + ic('workflow', 40) + '</span>';
    const W = 400, H = 200, padX = 56, yTop = 78, yBot = 128, n = steps.length;
    const xs = steps.map(function (_, i) { return padX + (i * (W - 2 * padX)) / (n - 1); });
    const ys = steps.map(function (_, i) { return i % 2 === 0 ? yTop : yBot; });
    let d = 'M' + xs[0].toFixed(1) + ' ' + ys[0];
    for (let i = 1; i < n; i++) {
      const mx = (xs[i - 1] + xs[i]) / 2;
      d += ' C' + mx.toFixed(1) + ' ' + ys[i - 1] + ' ' + mx.toFixed(1) + ' ' + ys[i] + ' ' + xs[i].toFixed(1) + ' ' + ys[i];
    }
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" focusable="false"><path class="pl-line" d="' + d + '"/>';
    steps.forEach(function (st, i) {
      const top = i % 2 === 0;
      const ty = top ? ys[i] - 24 : ys[i] + 22;
      s += '<circle class="pl-node" cx="' + xs[i].toFixed(1) + '" cy="' + ys[i] + '" r="8"/>' +
        '<text class="pl-n" x="' + xs[i].toFixed(1) + '" y="' + (ys[i] + 3) + '" text-anchor="middle">' + (i + 1) + '</text>' +
        '<text class="pl-label" x="' + xs[i].toFixed(1) + '" y="' + ty + '" text-anchor="middle">' + esc(st.label) + '</text>' +
        (st.detail ? '<text class="pl-detail" x="' + xs[i].toFixed(1) + '" y="' + (ty + (top ? 11 : 11)) + '" text-anchor="middle">' + esc(st.detail) + '</text>' : '');
    });
    return s + '</svg>';
  }

  function plate(p) {
    if (p.image) return '<div class="plate"><img src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async"></div>';
    return '<div class="plate" aria-hidden="true">' + diagram(p) + '</div>';
  }

  function card(p) {
    const repo = safeUrl(p.repo), demo = safeUrl(p.demo);
    const tech = p.tech || [];
    const shown = tech.slice(0, 5);
    return '<article class="project' + (p.featured ? ' is-featured' : '') + '" style="--h:' + hue(p) + '" data-id="' + esc(p.id) + '" data-tech="' + esc(tech.map(U.norm).join('|')) + '">' +
      plate(p) +
      '<div class="project-body">' +
      '<p class="project-type">' + esc(p.type || 'Project') + '</p>' +
      '<h3 class="project-title"><button type="button" class="project-open" data-project="' + esc(p.id) + '" aria-haspopup="dialog">' + esc(p.title) + '</button></h3>' +
      '<p class="project-sum">' + esc(p.summary) + '</p>' +
      '<ul class="chip-row">' + shown.map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') +
      (tech.length > shown.length ? '<li class="chip">+' + (tech.length - shown.length) + '</li>' : '') + '</ul>' +
      '<div class="project-foot"><span class="project-meta">' + (p.internship ? 'Internship at ' + esc(p.company || '') : 'Personal project') + '</span>' +
      '<div class="project-links">' +
      (repo ? '<a class="icon-btn" href="' + esc(repo) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(p.title) + ' on GitHub (opens in a new tab)">' + ic('github', 17) + '</a>' : '') +
      (demo ? '<a class="icon-btn" href="' + esc(demo) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(p.title) + ' live demo (opens in a new tab)">' + ic('external-link', 17) + '</a>' : '') +
      '</div></div></div></article>';
  }

  /* ---------------------------------------------------------------- filter */
  function techCounts() {
    const map = {};
    projects.forEach(function (p) {
      (p.tech || []).forEach(function (t) {
        const k = U.norm(t);
        map[k] = map[k] || { key: k, label: t, n: 0 };
        map[k].n++;
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.n - a.n || a.label.localeCompare(b.label); });
  }

  function renderFilters() {
    const host = $('#projectFilters');
    const all = techCounts();
    let list = all;
    if (!showAllTech && all.length > VISIBLE_FILTERS) {
      list = all.slice(0, VISIBLE_FILTERS);
      const cur = all.filter(function (t) { return t.key === activeTech; })[0];
      if (cur && list.indexOf(cur) < 0) list.push(cur);
    }
    host.innerHTML = '<button type="button" class="chip" data-tech="all" aria-pressed="' + (activeTech === 'all') + '">All projects <span class="count">' + projects.length + '</span></button>' +
      list.map(function (t) {
        return '<button type="button" class="chip" data-tech="' + esc(t.key) + '" aria-pressed="' + (activeTech === t.key) + '">' + esc(t.label) + ' <span class="count">' + t.n + '</span></button>';
      }).join('') +
      (all.length > VISIBLE_FILTERS ? '<button type="button" class="chip" data-more aria-expanded="' + showAllTech + '">' + (showAllTech ? 'Fewer technologies' : 'More technologies') + '</button>' : '');
  }

  function applyFilter(animate) {
    let shown = 0;
    $$('.project', $('#projectGrid')).forEach(function (el) {
      const match = activeTech === 'all' || el.dataset.tech.split('|').indexOf(activeTech) > -1;
      el.classList.toggle('is-hiding', !match);
      el.classList.remove('is-entering');
      if (match) { shown++; if (animate && !U.prefersReducedMotion()) { void el.offsetWidth; el.classList.add('is-entering'); } }
    });
    const label = activeTech === 'all' ? '' : ' using ' + (techCounts().filter(function (t) { return t.key === activeTech; })[0] || { label: '' }).label;
    $('#projectCount').textContent = 'Showing ' + shown + ' of ' + projects.length + (projects.length === 1 ? ' project' : ' projects') + label + '.';
  }

  /* ----------------------------------------------------------------- modal */
  function ticks(list) {
    return '<ul class="ticks">' + (list || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  function modalHTML(p) {
    const repo = safeUrl(p.repo), demo = safeUrl(p.demo);
    const skills = (p.skills || []).map(function (id) { return index.byId[id]; }).filter(Boolean);
    return '<div class="pm" style="--h:' + hue(p) + '">' +
      '<p class="pm-type">' + esc(p.type || 'Project') + (p.internship ? ', internship at ' + esc(p.company || '') : '') + '</p>' +
      '<h2 id="projectTitle">' + esc(p.title) + '</h2>' +
      '<p class="pm-sum">' + esc(p.summary) + '</p>' +
      ((repo || demo) ? '<div class="pm-links">' +
        (repo ? '<a class="btn btn-primary" href="' + esc(repo) + '" target="_blank" rel="noopener noreferrer">' + ic('github', 18) + '<span>View on GitHub</span></a>' : '') +
        (demo ? '<a class="btn btn-secondary" href="' + esc(demo) + '" target="_blank" rel="noopener noreferrer">' + ic('external-link', 18) + '<span>Live demo</span></a>' : '') + '</div>' : '') +

      '<section class="pm-block" aria-labelledby="pm-arch"><h3 id="pm-arch">Architecture and workflow</h3>' +
      (p.image ? '<img class="pm-image" src="' + esc(p.image) + '" alt="Architecture diagram for ' + esc(p.title) + '" loading="lazy">'
        : '<ol class="flow">' + (p.flow || []).map(function (st) {
          return '<li><p class="flow-label">' + esc(st.label) + '</p>' + (st.detail ? '<p class="flow-detail">' + esc(st.detail) + '</p>' : '') + '</li>';
        }).join('') + '</ol>') + '</section>' +

      '<div class="pm-cols">' +
      '<section><h3>Problem statement</h3><p>' + esc(p.problem) + '</p></section>' +
      '<section><h3>What I built</h3><p>' + esc(p.description) + '</p></section>' +
      '<section><h3>Key features</h3>' + ticks(p.features) + '</section>' +
      '<section><h3>Key achievements</h3>' + ticks(p.achievements) + '</section></div>' +

      '<section class="pm-block" aria-labelledby="pm-tech"><h3 id="pm-tech">Technologies used</h3><ul class="chip-row">' +
      (p.tech || []).map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul></section>' +

      (skills.length ? '<section class="pm-block" aria-labelledby="pm-skills"><h3 id="pm-skills">Skills this project uses</h3><ul class="chip-row">' +
        skills.map(function (sk) { return '<li><button type="button" class="chip" data-skill="' + esc(sk.id) + '">' + esc(sk.name) + '</button></li>'; }).join('') + '</ul></section>' : '') +
      '</div>';
  }

  function open(id) {
    const p = byId(id);
    if (!p) return;
    $('#projectBody').innerHTML = modalHTML(p);
    PF.ui.open('projectModal');
    $('#projectModal').scrollTop = 0;
  }

  /* ------------------------------------------------------------------ init */
  function init(ctx) {
    index = ctx.index;
    projects = (PF.data.projects || []).slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    $('#projectGrid').innerHTML = projects.map(card).join('');
    renderFilters();
    applyFilter(false);

    $('#projectFilters').addEventListener('click', function (e) {
      const more = e.target.closest('[data-more]');
      if (more) { showAllTech = !showAllTech; renderFilters(); const b = $('[data-more]'); if (b) b.focus(); return; }
      const b = e.target.closest('[data-tech]');
      if (!b) return;
      activeTech = b.dataset.tech === activeTech ? 'all' : b.dataset.tech;
      renderFilters(); applyFilter(true);
      const again = $('#projectFilters [data-tech="' + activeTech + '"]');
      if (again) again.focus();
    });
    $('#projectGrid').addEventListener('click', function (e) {
      const b = e.target.closest('[data-project]');
      if (b) open(b.dataset.project);
    });
    $('#projectBody').addEventListener('click', function (e) {
      const s = e.target.closest('[data-skill]');
      if (s) { PF.ui.close('projectModal'); PF.skills.open(s.dataset.skill); }
    });
  }

  PF.projects = { init: init, open: open };
})();
