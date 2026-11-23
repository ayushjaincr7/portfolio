/* ==========================================================================
   skills.js: category cards, the skill graph, and the skill panel (drawer).
   Everything is generated from data/skills.js, data/projects.js and the
   certificate list, so adding a skill or a link needs no change here.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, $$, esc } = U;
  const ic = function (n, s, c) { return PF.ui.icon(n, s, c); };

  const HUES = { languages: 205, ml: 222, dl: 240, genai: 262, backend: 282, cloud: 188 };
  let cats = [];
  let index = null;
  let levels = {};
  let graphBuilt = false;
  let current = null; // skill shown in the panel

  const hueOf = function (cat) { return cat.hue != null ? cat.hue : (HUES[cat.id] != null ? HUES[cat.id] : 235); };
  const levelOf = function (sk) { return levels[sk.id] != null ? levels[sk.id] : sk.level; };
  const catOf = function (sk) { return cats.filter(function (c) { return c.id === sk.category; })[0]; };
  const isLearning = function (sk) { return sk.status === 'learning'; };
  const projectsFor = function (sk) { return (PF.data.projects || []).filter(function (p) { return (p.skills || []).indexOf(sk.id) > -1; }); };
  const certsFor = function (sk) { return PF.certs && PF.certs.forSkill ? PF.certs.forSkill(sk) : []; };

  /* ----------------------------------------------------------------- cards */
  function miniGraph() {
    const n = 14, r = 56, cx = 75, cy = 75;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    let s = '<svg class="mini" viewBox="0 0 150 150" aria-hidden="true" focusable="false">';
    [[0, 5], [0, 9], [2, 8], [3, 11], [4, 12], [6, 13], [1, 7], [5, 10], [2, 12]].forEach(function (e) {
      const a = pts[e[0]], b = pts[e[1]];
      s += '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + cx + ' ' + cy + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" fill="none" stroke="currentColor" stroke-opacity=".45"/>';
    });
    pts.forEach(function (p) { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" fill="currentColor"/>'; });
    return s + '</svg>';
  }

  function renderCards() {
    const host = $('#skillCards');
    host.innerHTML = cats.map(function (cat) {
      const n = cat.skills.length;
      return '<article class="cat' + (n >= 7 ? ' is-wide' : '') + '" style="--h:' + hueOf(cat) + '" aria-labelledby="cat-' + esc(cat.id) + '">' +
        '<div class="cat-head"><span class="cat-icon">' + ic(cat.icon || 'cpu', 22) + '</span>' +
        '<div><h3 id="cat-' + esc(cat.id) + '">' + esc(cat.name) + '</h3><p class="cat-blurb">' + esc(cat.blurb || '') + '</p></div>' +
        '<span class="cat-count">' + n + (n === 1 ? ' skill' : ' skills') + '</span></div>' +
        '<ul class="skill-list">' + cat.skills.map(function (sk) {
          return '<li><button type="button" class="skill" data-skill="' + esc(sk.id) + '" style="--lv:' + levelOf(sk) + '%"' +
            (isLearning(sk) ? ' data-learning' : '') + ' aria-haspopup="dialog">' + esc(sk.name) +
            (isLearning(sk) ? '<span class="skill-tag">learning</span>' : '') + '</button></li>';
        }).join('') + '</ul></article>';
    }).join('') +
      '<article class="cat graph-tile" style="--h:240"><div><h3>See how it all connects</h3>' +
      '<p>The skill graph joins every skill to the others I have used it with in a project.</p>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="openGraph">' + ic('share-2', 16) + '<span>Open the skill graph</span></button></div>' + miniGraph() + '</article>';
  }

  /* ----------------------------------------------------------------- graph */
  function buildGraph() {
    const host = $('#skillGraph');
    const W = 1040, H = 880, cx = 520, cy = 440, R = 300, GAP = 1.1;
    const total = cats.reduce(function (n, c) { return n + c.skills.length; }, 0);
    const step = (Math.PI * 2) / (total + cats.length * GAP);
    const pos = {};
    const arcs = [];
    let a = -Math.PI / 2;
    cats.forEach(function (cat) {
      const start = a;
      cat.skills.forEach(function (sk) {
        pos[sk.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a: a, cat: cat };
        a += step;
      });
      arcs.push({ cat: cat, from: start - step * 0.32, to: a - step + step * 0.32 });
      a += step * GAP;
    });

    /* edges: skills that appear together in a project */
    const weight = {};
    (PF.data.projects || []).forEach(function (p) {
      const ids = (p.skills || []).filter(function (id) { return pos[id]; });
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const k = [ids[i], ids[j]].sort().join('|');
        weight[k] = (weight[k] || 0) + 1;
      }
    });

    const arcR = R - 26;
    const pt = function (r, ang) { return (cx + r * Math.cos(ang)).toFixed(1) + ' ' + (cy + r * Math.sin(ang)).toFixed(1); };
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Skill graph. Each dot is a skill; lines join skills used together in a project.">';

    arcs.forEach(function (arc) {
      const large = arc.to - arc.from > Math.PI ? 1 : 0;
      svg += '<path class="garc" style="stroke:hsl(' + hueOf(arc.cat) + ' var(--hue-s) var(--hue-l))" d="M' + pt(arcR, arc.from) + ' A' + arcR + ' ' + arcR + ' 0 ' + large + ' 1 ' + pt(arcR, arc.to) + '"/>';
    });

    Object.keys(weight).forEach(function (k) {
      const ids = k.split('|');
      const p = pos[ids[0]], q = pos[ids[1]];
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const qx = cx + (mx - cx) * 0.32, qy = cy + (my - cy) * 0.32;
      svg += '<path class="gedge' + (weight[k] > 1 ? ' is-strong' : '') + '" data-a="' + ids[0] + '" data-b="' + ids[1] + '" style="--h:' + hueOf(p.cat) +
        '" d="M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + '"/>';
    });

    cats.forEach(function (cat) {
      cat.skills.forEach(function (sk) {
        const p = pos[sk.id];
        const cos = Math.cos(p.a), sin = Math.sin(p.a);
        const anchor = cos > 0.14 ? 'start' : cos < -0.14 ? 'end' : 'middle';
        const lx = cx + (R + 20) * cos, ly = cy + (R + 20) * sin + (anchor === 'middle' ? (sin < 0 ? -6 : 14) : 5);
        svg += '<g class="gnode" data-skill="' + esc(sk.id) + '" tabindex="0" role="button" aria-label="' + esc(sk.name + ', ' + cat.name + (isLearning(sk) ? ', still learning' : '') + '. Open details.') + '"' +
          (isLearning(sk) ? ' data-learning' : '') + ' style="--h:' + hueOf(cat) + ';--c:hsl(var(--h) var(--hue-s) var(--hue-l))">' +
          '<circle class="hit" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="15"/>' +
          '<circle class="ring" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="13"/>' +
          '<circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="6.5"/>' +
          '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anchor + '">' + esc(sk.name) + '</text></g>';
      });
    });

    svg += '<text class="gcenter-big" x="' + cx + '" y="' + (cy + 2) + '">' + total + '</text><text class="gcenter" x="' + cx + '" y="' + (cy + 28) + '">skills</text></svg>';

    host.innerHTML = '<div class="graph-stage">' + svg + '</div>' +
      '<ul class="graph-legend" aria-label="Legend">' + cats.map(function (c) { return '<li><i style="--h:' + hueOf(c) + '"></i>' + esc(c.name) + '</li>'; }).join('') +
      '<li class="lg-learning"><i></i>Still learning</li></ul>';

    /* hover / focus tracing */
    const root = host.querySelector('svg');
    const edges = $$('.gedge', root), nodes = {};
    $$('.gnode', root).forEach(function (n) { nodes[n.dataset.skill] = n; });
    function trace(id) {
      root.classList.add('has-hover');
      nodes[id].classList.add('on');
      edges.forEach(function (e) {
        if (e.dataset.a === id || e.dataset.b === id) {
          e.classList.add('on');
          const other = e.dataset.a === id ? e.dataset.b : e.dataset.a;
          if (nodes[other]) nodes[other].classList.add('on');
        }
      });
    }
    function clear() {
      root.classList.remove('has-hover');
      $$('.on', root).forEach(function (el) { el.classList.remove('on'); });
    }
    $$('.gnode', root).forEach(function (n) {
      n.addEventListener('pointerenter', function () { clear(); trace(n.dataset.skill); });
      n.addEventListener('pointerleave', clear);
      n.addEventListener('focus', function () { clear(); trace(n.dataset.skill); });
      n.addEventListener('blur', clear);
      n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n.dataset.skill); } });
    });
    graphBuilt = true;
  }

  function setView(view) {
    const graph = view === 'graph';
    if (graph && !graphBuilt) buildGraph();
    $('#skillCards').hidden = graph;
    $('#skillGraph').hidden = !graph;
    $('#viewCards').setAttribute('aria-pressed', String(!graph));
    $('#viewGraph').setAttribute('aria-pressed', String(graph));
    $('#skillsHint').innerHTML = graph
      ? 'Lines join skills I have used together in a project. Point at a skill to trace them, select one for details.'
      : 'Dashed outline means I&rsquo;m still learning it.';
  }

  /* ----------------------------------------------------------------- panel */
  function panelHTML(sk) {
    const cat = catOf(sk), lv = levelOf(sk);
    const projects = projectsFor(sk), certs = certsFor(sk);
    return '<div class="skill-panel" style="--h:' + hueOf(cat) + '">' +
      '<p class="panel-cat"><i></i>' + esc(cat.name) + '</p>' +
      '<h2 id="skillTitle">' + esc(sk.name) + (isLearning(sk) ? '<span class="badge">Learning</span>' : '') + '</h2>' +
      '<p class="panel-desc">' + esc(sk.desc) + '</p>' +

      '<section class="panel-sec" aria-labelledby="sp-level"><h3 id="sp-level">Proficiency</h3>' +
      '<div class="meter" role="meter" aria-label="Proficiency" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + lv + '" aria-valuetext="' + U.levelLabel(lv) + '"><span style="width:' + lv + '%"></span></div>' +
      '<p class="meter-label"><b id="lvLabel">' + U.levelLabel(lv) + '</b><span>Self-assessed</span></p>' +
      '<div class="slider-wrap" data-owner-only><label for="lvRange">Adjust proficiency <output id="lvOut" for="lvRange">' + lv + '</output></label>' +
      '<input type="range" id="lvRange" min="0" max="100" step="1" value="' + lv + '">' +
      '<p class="fine">Saved ' + (PF.store.mode === 'cloud' ? 'to Supabase, so every visitor sees it.' : 'in this browser only.') + ' Edit <span class="mono">level</span> in data/skills.js to change the default.</p></div></section>' +

      '<section class="panel-sec" aria-labelledby="sp-proj"><h3 id="sp-proj">Related projects</h3>' +
      (projects.length ? '<div class="rel-list">' + projects.map(function (p) {
        return '<button type="button" class="rel" data-open-project="' + esc(p.id) + '"><span><b>' + esc(p.title) + '</b><small>' + esc(p.type || '') + '</small></span>' + ic('arrow-up-right', 16) + '</button>';
      }).join('') + '</div>' : '<p class="empty-note">No project is linked to this skill yet.</p>') + '</section>' +

      '<section class="panel-sec" aria-labelledby="sp-cert"><h3 id="sp-cert">Related certifications</h3>' +
      (certs.length ? '<div class="rel-list">' + certs.map(function (c) {
        return '<button type="button" class="rel" data-open-cert="' + esc(c.id) + '"><span><b>' + esc(c.title) + '</b><small>' + esc(c.issuer) + (c.issueDate ? ', ' + esc(U.fmtMonthYear(c.issueDate)) : '') + '</small></span>' + ic('arrow-up-right', 16) + '</button>';
      }).join('') + '</div><button type="button" class="link-btn" style="margin-top:14px" data-show-certs>See these in the certificates section</button>'
        : '<p class="empty-note">No certificate is linked to this skill yet.<span data-owner-only> Add one with &ldquo;' + esc(sk.name) + '&rdquo; in its skills list and it will appear here.</span></p>') + '</section>' +

      '<section class="panel-sec" aria-labelledby="sp-tools"><h3 id="sp-tools">Technologies and tools</h3>' +
      '<ul class="chip-row">' + (sk.tools || []).map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul></section>' +
      '</div>';
  }

  function open(id) {
    const sk = index.byId[id];
    if (!sk) return;
    current = sk;
    $('#skillBody').innerHTML = panelHTML(sk);
    PF.ui.open('skillDrawer');
    $('#skillDrawer').scrollTop = 0;
  }

  function wirePanel() {
    const body = $('#skillBody');
    const drawer = $('#skillDrawer');
    drawer.setAttribute('aria-labelledby', 'skillTitle');

    body.addEventListener('click', function (e) {
      const pr = e.target.closest('[data-open-project]');
      const ce = e.target.closest('[data-open-cert]');
      const all = e.target.closest('[data-show-certs]');
      if (pr) { PF.ui.close(drawer); PF.projects.open(pr.dataset.openProject); }
      else if (ce) { PF.ui.close(drawer); PF.certs.open(ce.dataset.openCert); }
      else if (all && current) { PF.ui.close(drawer); PF.certs.filterBySkill(current.id); PF.ui.goTo('certifications'); }
    });

    let saveTimer;
    body.addEventListener('input', function (e) {
      if (e.target.id !== 'lvRange' || !current) return;
      const v = +e.target.value;
      levels[current.id] = v;
      $('#lvOut').textContent = v;
      $('#lvLabel').textContent = U.levelLabel(v);
      const m = $('.meter', body);
      m.setAttribute('aria-valuenow', v); m.setAttribute('aria-valuetext', U.levelLabel(v));
      m.firstElementChild.style.width = v + '%';
      const chip = $('.skill[data-skill="' + current.id + '"]');
      if (chip) chip.style.setProperty('--lv', v + '%');
      clearTimeout(saveTimer);
      const id = current.id;
      saveTimer = setTimeout(function () {
        PF.store.saveLevel(id, v).then(function () { PF.ui.toast('Saved ' + index.byId[id].name + ' at ' + U.levelLabel(v).toLowerCase() + '.', 'ok'); })
          .catch(function (ex) { PF.ui.toast(ex.message, 'error'); });
      }, 500);
    });
  }

  /* ------------------------------------------------------------------ init */
  function init(ctx) {
    index = ctx.index;
    cats = PF.data.skillCategories || [];
    levels = ctx.levels || {};
    renderCards();

    $('#skillCards').addEventListener('click', function (e) {
      const b = e.target.closest('.skill');
      if (b) open(b.dataset.skill);
      else if (e.target.closest('#openGraph')) setView('graph');
    });
    $('#skillGraph').addEventListener('click', function (e) {
      const n = e.target.closest('.gnode');
      if (n) open(n.dataset.skill);
    });
    $('#viewCards').addEventListener('click', function () { setView('cards'); });
    $('#viewGraph').addEventListener('click', function () { setView('graph'); });
    wirePanel();
  }

  /* Saved levels arrive after the first paint (they live in storage), so update the bars in place. */
  function setLevels(saved) {
    levels = saved || {};
    index.list.forEach(function (sk) {
      const el = $('.skill[data-skill="' + sk.id + '"]');
      if (el) el.style.setProperty('--lv', levelOf(sk) + '%');
    });
  }

  PF.skills = { init: init, open: open, levelOf: levelOf, setLevels: setLevels };
})();
