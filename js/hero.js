/* ==========================================================================
   hero.js
   1. A star field in the hero sky that is also an embedding space. The pointer is
      the query vector: its five nearest stars light up and connect, as in a k-NN
      lookup. With no pointer (touch, idle) the query drifts on its own path.
      Sakura petals fall through the same canvas.
   2. The menu bar: types the retrieval query once, then reveals the ranked links.
   3. The scene crop: keeps the moon in frame when the hero stacks on small screens.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const K = 5;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ----------------------------------------------------------- point cloud */
  function initField() {
    const canvas = U.$('#heroField');
    const hero = U.$('#hero');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduce = U.prefersReducedMotion();

    let W = 0, H = 0, dpr = 1, pts = [], raf = 0, onScreen = true, tabVisible = true, t0 = performance.now();
    const q = { x: 0, y: 0, tx: 0, ty: 0, pointerAt: -1e9 };
    const clusterHue = [192, 330, 48, 262, 205, 318]; /* cyan, pink, gold, lavender */
    let petals = [];

    function build() {
      const rect = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rnd = mulberry32(20241);
      const count = Math.max(34, Math.min(120, Math.round((W * H) / 12000)));
      const centers = clusterHue.map(function (h, i) {
        const side = i % 2 === 0 ? 0.66 : 0.3; /* more stars on the right, around the moon */
        return { x: (side + (rnd() - 0.5) * 0.4), y: 0.08 + rnd() * 0.34, h: h, s: 0.07 + rnd() * 0.05 };
      });
      pts = [];
      for (let i = 0; i < count; i++) {
        const c = centers[Math.floor(rnd() * centers.length)];
        /* box-muller for a soft cluster */
        const u = Math.max(rnd(), 1e-6), v = rnd();
        const g1 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        const g2 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
        pts.push({
          bx: Math.min(W - 8, Math.max(8, (c.x + g1 * c.s * 1.5) * W)),
          by: Math.min(H * 0.52, Math.max(8, (c.y + g2 * c.s * 1.4) * H)),
          ph: rnd() * 6.283, sp: 0.00018 + rnd() * 0.00026, amp: 4 + rnd() * 9,
          h: c.h, r: 1 + rnd() * 0.9, x: 0, y: 0
        });
      }
      q.x = q.tx = W * 0.66; q.y = q.ty = H * 0.26;

      petals = [];
      const np = W < 700 ? 9 : 16;
      for (let i = 0; i < np; i++) {
        petals.push({ x0: rnd() * W, y0: rnd() * H, vy: 0.016 + rnd() * 0.022, vx: 0.006 + rnd() * 0.012, sw: 18 + rnd() * 34, ph: rnd() * 6.283, sp: 0.0004 + rnd() * 0.0005, s: 5 + rnd() * 5, rot: rnd() * 6.283, vr: (rnd() - 0.5) * 0.0016 });
      }
    }

    function col(h, a) {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      /* dark: pastel stars on the twilight sky; light: white sparkles on the blue sky */
      return 'hsla(' + h + ',' + (light ? 100 : 92) + '%,' + (light ? 97 : 80) + '%,' + a + ')';
    }

    /* sakura petals: positions are a pure function of time, so nothing to integrate */
    function drawPetals(t) {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        const span = H + 60;
        const y = ((p.y0 + t * p.vy) % span + span) % span - 30;
        const x = ((p.x0 + t * p.vx + Math.sin(t * p.sp + p.ph) * p.sw) % (W + 60) + W + 60) % (W + 60) - 30;
        const a = p.rot + t * p.vr * 4;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(t * p.sp * 1.7 + p.ph)));
        ctx.fillStyle = light ? 'rgba(255, 120, 170, 0.92)' : 'rgba(255, 158, 200, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.95, -p.s * 0.7, p.s * 0.8, p.s * 0.6, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.8, p.s * 0.6, -p.s * 0.95, -p.s * 0.7, 0, -p.s);
        ctx.fill();
        ctx.restore();
      }
    }

    function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);

      /* query target: the pointer if it moved recently, otherwise a slow wander */
      if (now - q.pointerAt > 2600) {
        q.tx = W * (0.62 + 0.24 * Math.sin(t * 0.00011));
        q.ty = H * (0.26 + 0.12 * Math.sin(t * 0.00017 + 1.2));
      }
      const k = reduce ? 1 : 0.085;
      q.x += (q.tx - q.x) * k;
      q.y += (q.ty - q.y) * k;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x = p.bx + Math.cos(t * p.sp + p.ph) * p.amp;
        p.y = p.by + Math.sin(t * p.sp * 1.3 + p.ph) * p.amp;
      }

      /* faint links inside a cluster: the structure of the space */
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (pts[i].h !== pts[j].h) continue;
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000) {
            ctx.strokeStyle = col(pts[i].h, 0.22 * (1 - d2 / 9000));
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }

      /* k nearest neighbours of the query */
      const near = [];
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - q.x, dy = pts[i].y - q.y;
        near.push({ i: i, d: dx * dx + dy * dy });
      }
      near.sort(function (a, b) { return a.d - b.d; });
      const top = near.slice(0, K);
      const isTop = {};
      top.forEach(function (n) { isTop[n.i] = true; });

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (isTop[i]) continue;
        ctx.fillStyle = col(p.h, 0.78 + 0.2 * Math.sin(t * p.sp * 6 + p.ph));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      top.forEach(function (n, rank) {
        const p = pts[n.i];
        const a = 0.62 - rank * 0.09;
        ctx.strokeStyle = col(p.h, a);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = col(p.h, 0.95);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1.6, 0, 6.283); ctx.fill();
        ctx.strokeStyle = col(p.h, 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, 6.283); ctx.stroke();
      });

      /* the query vector itself */
      ctx.strokeStyle = col(330, 0.95);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = col(330, 0.4);
      ctx.beginPath(); ctx.arc(q.x, q.y, 15, 0, 6.283); ctx.stroke();

      drawPetals(t);

      if (!reduce && running()) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    function running() { return onScreen && tabVisible; }
    function start() { if (!raf && !reduce && running()) raf = requestAnimationFrame(frame); }
    function drawOnce() { frame(performance.now()); }

    build();
    if (reduce) drawOnce(); else start();

    hero.addEventListener('pointermove', function (e) {
      const r = canvas.getBoundingClientRect();
      q.tx = e.clientX - r.left; q.ty = e.clientY - r.top; q.pointerAt = performance.now();
      if (reduce) drawOnce();
    }, { passive: true });

    let rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { build(); if (reduce || !raf) drawOnce(); }, 150);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) start(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; if (tabVisible) start(); });
    PF.bus.on('theme', function () { if (reduce || !raf) drawOnce(); });
  }

  /* ---------------------------------------------------------- retrieval card */
  function initTrace() {
    const card = U.$('#trace');
    if (!card) return;

    /* fill in real numbers from the data files */
    const d = PF.data;
    const nProj = (d.projects || []).length;
    const cats = d.skillCategories || [];
    const nSkills = cats.reduce(function (n, c) { return n + c.skills.length; }, 0);
    const jobs = d.experience || [];
    const set = function (k, v) { const el = U.$('[data-trace="' + k + '"]', card); if (el && v) el.textContent = v; };
    if (nProj) set('projects', nProj + ' projects: agents, RAG, vision and ML services');
    if (nSkills) set('skills', nSkills + ' skills in ' + cats.length + ' areas, linked to the work behind them');
    if (jobs.length > 1) set('experience', jobs[0].role + ' at ' + jobs[0].company + ', ' + jobs[1].role + ' at ' + jobs[1].company);
    else if (jobs.length) set('experience', jobs[0].role + ' at ' + jobs[0].company);

    if (U.prefersReducedMotion()) return;

    const qEl = U.$('#traceQuery');
    const full = qEl.textContent;
    U.$$('.trace-rows li', card).forEach(function (li, i) { li.style.setProperty('--i', i); });
    card.classList.add('is-armed', 'is-typing');
    qEl.textContent = '';
    let n = 0;
    setTimeout(function type() {
      n++;
      qEl.textContent = full.slice(0, n);
      if (n < full.length) setTimeout(type, 34);
      else setTimeout(function () { card.classList.remove('is-typing'); card.classList.add('is-run'); }, 260);
    }, 450);
  }

  /* ------------------------------------------------------------ scene crop */
  function initScene() {
    const svg = U.$('.hero-scene-svg');
    if (!svg || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 1100px)');
    function set() { svg.setAttribute('preserveAspectRatio', mq.matches ? 'xMaxYMax slice' : 'xMidYMax slice'); }
    set();
    if (mq.addEventListener) mq.addEventListener('change', set); else if (mq.addListener) mq.addListener(set);
  }

  PF.hero = { init: function () { try { initScene(); } catch (e) { console.error('[hero scene]', e); } try { initField(); } catch (e) { console.error('[hero field]', e); } try { initTrace(); } catch (e) { console.error('[hero trace]', e); } } };
})();
