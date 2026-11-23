/* ==========================================================================
   github.js: optional live GitHub block under the projects.
   Uses the public GitHub API (no token). Stays hidden until data/site.js has a
   real GitHub profile URL, and quietly stays hidden if the request fails.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, esc } = U;
  const ic = function (n, s) { return PF.ui.icon(n, s); };
  const TTL = 10 * 60 * 1000;

  function username() {
    const m = /github\.com\/([^/?#\s]+)/i.exec((PF.data.site.social || {}).github || '');
    /* real GitHub usernames are letters, digits and hyphens only, which also rejects the placeholder */
    if (!m || !/^[A-Za-z0-9-]+$/.test(m[1])) return '';
    return m[1];
  }

  async function getJson(url) {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('GitHub responded ' + r.status);
    return r.json();
  }

  async function load(user) {
    const key = 'pf.gh.' + user;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (c && Date.now() - c.t < TTL) return c.d;
    } catch (e) { /* ignore */ }
    const res = await Promise.all([
      getJson('https://api.github.com/users/' + user),
      getJson('https://api.github.com/users/' + user + '/repos?per_page=100&sort=pushed')
    ]);
    const d = { profile: res[0], repos: res[1] };
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ignore */ }
    return d;
  }

  function render(user, d) {
    const repos = (d.repos || []).filter(function (r) { return !r.fork && !r.archived; });
    if (!repos.length) return;
    const stars = repos.reduce(function (n, r) { return n + (r.stargazers_count || 0); }, 0);
    const top = repos.slice().sort(function (a, b) {
      return (b.stargazers_count || 0) - (a.stargazers_count || 0) || new Date(b.pushed_at) - new Date(a.pushed_at);
    }).slice(0, PF.data.site.github.featuredRepos || 4);

    const host = $('#githubBlock');
    host.innerHTML =
      '<div class="gh-top"><h3>Recently on GitHub</h3><p class="gh-stats">' +
      '<span><b>' + (d.profile.public_repos || repos.length) + '</b> public repositories</span>' +
      '<span><b>' + stars + '</b> stars</span><span><b>' + (d.profile.followers || 0) + '</b> followers</span></p></div>' +
      '<div class="gh-repos">' + top.map(function (r) {
        return '<a class="gh-repo" href="' + esc(r.html_url) + '" target="_blank" rel="noopener noreferrer">' +
          '<strong>' + esc(r.name) + '</strong><p>' + esc(r.description || 'No description yet.') + '</p>' +
          '<span class="gh-meta">' + (r.language ? '<span>' + esc(r.language) + '</span>' : '') +
          '<span>' + ic('star', 14) + (r.stargazers_count || 0) + '</span>' +
          '<span>' + ic('git-fork', 14) + (r.forks_count || 0) + '</span></span></a>';
      }).join('') + '</div>' +
      '<p style="margin-top:20px"><a class="link-btn" href="https://github.com/' + esc(user) + '?tab=repositories" target="_blank" rel="noopener noreferrer">' +
      '<span>See every repository on GitHub</span>' + ic('arrow-up-right', 14) + '</a></p>';
    host.hidden = false;
  }

  function init() {
    const user = username();
    if (!user || !window.fetch) return;
    load(user).then(function (d) { render(user, d); }).catch(function (e) { console.info('[github] block hidden:', e.message); });
  }

  PF.github = { init: init };
})();
