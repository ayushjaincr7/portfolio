/* ==========================================================================
   sections.js: About, Experience, Education and the learning journey.
   All copy comes from data/about.js, data/experience.js and data/education.js.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, esc } = U;
  const ic = function (n, s, c) { return PF.ui.icon(n, s, c); };

  /* ----------------------------------------------------------------- about */
  function renderAbout() {
    const a = PF.data.about;
    if (!a) return;
    $('#aboutLead').textContent = a.lead;
    $('#aboutBody').innerHTML = (a.body || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');

    $('#aboutSheet').innerHTML = (a.sheet || []).map(function (r) {
      return '<div class="sheet-row"><dt>' + ic(r.icon || 'info', 18) + '<span>' + esc(r.label) + '</span></dt><dd>' + esc(r.text) +
        (r.href ? '<br><a class="text-link" href="' + esc(r.href) + '">' + esc(r.cta || 'Read more') + '</a>' : '') + '</dd></div>';
    }).join('');

    if (a.approach) {
      $('#aboutApproach').innerHTML = '<h3 class="block-title">' + esc(a.approach.title) + '</h3><ol class="steps">' +
        a.approach.steps.map(function (s, i) {
          return '<li><span class="step-n" aria-hidden="true">' + (i + 1) + '</span><h4>' + esc(s.title) + '</h4><p>' + esc(s.text) + '</p></li>';
        }).join('') + '</ol>';
    }
    if (a.aspirations) {
      $('#aboutAspire').innerHTML = '<div class="aspire-head"><h3 class="block-title">' + esc(a.aspirations.title) + '</h3><p class="lead">' + esc(a.aspirations.intro) + '</p></div>' +
        '<ul class="tracks">' + a.aspirations.tracks.map(function (t) {
          return '<li>' + ic(t.icon || 'sparkles', 26) + '<h4>' + esc(t.title) + '</h4><p>' + esc(t.text) + '</p></li>';
        }).join('') + '</ul>';
    }
  }

  /* ------------------------------------------------------------ experience */
  function renderExperience() {
    const jobs = PF.data.experience || [];
    $('#experienceTimeline').innerHTML = jobs.map(function (j) {
      const current = !j.end;
      const period = U.fmtMonthYear(j.start) + ' to ' + (current ? 'Present' : U.fmtMonthYear(j.end));
      const proj = j.project && (PF.data.projects || []).filter(function (p) { return p.id === j.project; })[0];
      return '<li class="job' + (current ? ' is-current' : '') + '">' +
        '<div class="job-when"><p class="job-period">' + esc(period) + '</p><p class="job-dur">' + esc(U.duration(j.start, j.end)) + '</p></div>' +
        '<div class="job-main"><h3 class="job-company">' + esc(j.company) + '</h3>' +
        '<p class="job-role">' + esc(j.role) + (j.type ? '<span>' + esc(j.type) + '</span>' : '') + '</p>' +
        (j.summary ? '<p class="job-sum">' + esc(j.summary) + '</p>' : '') +
        (j.highlights && j.highlights.length ? '<ul class="ticks">' + j.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
        (j.tech && j.tech.length ? '<ul class="chip-row">' + j.tech.map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
        (proj ? '<button type="button" class="link-btn" data-project="' + esc(proj.id) + '">' + ic('workflow', 15) + '<span>See the project: ' + esc(proj.title) + '</span></button>' : '') +
        '</div></li>';
    }).join('');

    $('#experienceTimeline').addEventListener('click', function (e) {
      const b = e.target.closest('[data-project]');
      if (b) PF.projects.open(b.dataset.project);
    });
  }

  /* ------------------------------------------------------------- education */
  function renderEducation() {
    $('#educationList').innerHTML = (PF.data.education || []).map(function (ed) {
      return '<article class="edu"><div><h3 class="edu-degree">' + esc(ed.degree) + '</h3>' +
        '<p class="edu-uni"><b>' + esc(ed.institute) + '</b>Affiliated to ' + esc(ed.university) + '</p></div>' +
        (ed.focus && ed.focus.length ? '<div class="edu-focus"><h3>Focus areas</h3><ul class="chip-row">' +
          ed.focus.map(function (f) { return '<li class="chip">' + esc(f) + '</li>'; }).join('') + '</ul></div>' : '') + '</article>';
    }).join('');

    const L = PF.data.learning;
    if (!L) return;
    $('#learningIntro').textContent = L.intro || '';
    const state = { done: 'Done', current: 'In progress', next: 'Up next' };
    $('#learningStages').innerHTML = L.stages.map(function (s) {
      return '<li class="stage is-' + esc(s.status) + '"><div class="stage-head"><span class="stage-mark" aria-hidden="true"></span><h3>' + esc(s.title) +
        '</h3><span class="stage-state">' + (state[s.status] || '') + '</span></div><p>' + esc(s.detail) + '</p>' +
        (s.tags && s.tags.length ? '<ul class="chip-row">' + s.tags.map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('') + '</ul>' : '') + '</li>';
    }).join('');

    $('#learningNow').innerHTML = (L.now || []).map(function (n) {
      return n.skill
        ? '<li><button type="button" class="chip" data-skill="' + esc(n.skill) + '">' + esc(n.label) + '</button></li>'
        : '<li class="chip">' + esc(n.label) + '</li>';
    }).join('');
    $('#learningNow').addEventListener('click', function (e) {
      const b = e.target.closest('[data-skill]');
      if (b) PF.skills.open(b.dataset.skill);
    });
  }

  PF.sections = { init: function () { renderAbout(); renderExperience(); renderEducation(); } };
})();
