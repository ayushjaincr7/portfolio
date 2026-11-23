/* ==========================================================================
   certs.js: certificate gallery, filters, preview modal and the owner's
   add / edit / delete form. Storage is handled by PF.store (certs-store.js).

   Skill relationship: a certificate's skills are plain text. Each one is matched
   to the skill list by id, name or alias (see data/skills.js), which is what
   makes "Python -> its certificates" and "certificate -> its skills" work both ways.
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, $$, esc } = U;
  const ic = function (n, s, c) { return PF.ui.icon(n, s, c); };

  const MAX_BYTES = 10 * 1024 * 1024;
  const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  let index = null;
  let all = [];
  let view = [];
  const state = { category: 'all', skillId: null, query: '' };
  let modalId = null;
  let editing = null;
  let pending = null; // { file, thumb: Promise<Blob|null> } for the file chosen in the form
  let tags = [];
  let previewUrls = [];
  let previewToken = 0;

  const categories = function () { return (PF.data.certCategories || []).map(function (c) { return c.id; }); };
  const safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };
  const isPdf = function (c) { return c.fileType === 'application/pdf'; };
  const byId = function (id) { return all.filter(function (c) { return c.id === id; })[0]; };
  const owner = function () { return PF.store.auth.isOwner(); };

  function certSkills(c) {
    return (c.skills || []).map(function (t) { return { text: t, skill: index.match(t) }; });
  }
  function hasSkill(c, id) { return certSkills(c).some(function (x) { return x.skill && x.skill.id === id; }); }
  function forSkill(sk) { return all.filter(function (c) { return hasSkill(c, sk.id); }); }

  /* ------------------------------------------------------------- filtering */
  function haystack(c) {
    return [c.title, c.issuer, c.category, c.credentialId, c.description, (c.skills || []).join(' ')].join(' ').toLowerCase();
  }
  function passesSkillAndQuery(c) {
    if (state.skillId && !hasSkill(c, state.skillId)) return false;
    const q = state.query.trim().toLowerCase();
    return !q || haystack(c).indexOf(q) > -1;
  }
  function applyFilters() {
    view = all.filter(function (c) {
      return passesSkillAndQuery(c) && (state.category === 'all' || c.category === state.category);
    });
  }

  /* --------------------------------------------------------------- render */
  function renderOwnerBar() {
    const bar = $('#certOwnerBar');
    bar.hidden = !owner();
    if (!owner()) return;
    const cloud = PF.store.mode === 'cloud';
    let msg = cloud
      ? 'Owner mode is on. Certificates you add, edit or delete are saved to Supabase and change for every visitor.'
      : 'Owner mode is on. Certificates you add are saved in this browser only. Connect Supabase (see the README) to publish them for everyone.';
    if (PF.store.volatile) msg = 'Your browser is blocking site storage, so certificates you add will disappear when you reload this page.';
    bar.innerHTML = '<p>' + esc(msg) + '</p><div class="owner-bar-actions">' +
      '<button type="button" class="btn btn-primary btn-sm" data-add-cert>' + ic('plus', 16) + '<span>Add certificate</span></button></div>';
  }

  function renderFilters() {
    const wrap = $('#certFilters');
    const pool = all.filter(passesSkillAndQuery);
    const counts = {};
    pool.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
    const cats = categories().filter(function (id) { return counts[id] || state.category === id; });
    wrap.innerHTML = '<button type="button" class="chip" data-cat="all" aria-pressed="' + (state.category === 'all') + '">All <span class="count">' + pool.length + '</span></button>' +
      cats.map(function (id) {
        return '<button type="button" class="chip" data-cat="' + esc(id) + '" aria-pressed="' + (state.category === id) + '">' + esc(id) + ' <span class="count">' + (counts[id] || 0) + '</span></button>';
      }).join('');
  }

  function renderActive() {
    const el = $('#certActiveFilter');
    const sk = state.skillId && index.byId[state.skillId];
    el.hidden = !sk;
    if (sk) el.innerHTML = '<span>Certificates that cover <b>' + esc(sk.name) + '</b></span>' +
      '<button type="button" class="chip" data-clear-skill>' + ic('x', 13) + '<span>Clear</span></button>';
  }

  function thumb(c) {
    const pdf = isPdf(c);
    const inner = c.thumbUrl
      ? '<img src="' + esc(c.thumbUrl) + '" alt="" loading="lazy" decoding="async">'
      : '<span class="cert-ph">' + ic(pdf ? 'file-text' : 'image', 34) + '<span>' + (pdf ? 'PDF certificate' : 'Certificate image') + '</span></span>';
    return '<button type="button" class="cert-thumb" data-open="' + esc(c.id) + '" aria-label="Preview ' + esc(c.title) + '">' + inner +
      '<span class="cert-kind">' + (pdf ? 'PDF' : 'Image') + '</span><span class="cert-view">' + ic('eye', 15) + 'Preview</span></button>';
  }

  function card(c) {
    const sk = certSkills(c), shown = sk.slice(0, 4), verify = safeUrl(c.credentialUrl);
    return '<article class="cert" data-id="' + esc(c.id) + '">' + thumb(c) +
      '<div class="cert-body"><p class="cert-cat">' + esc(c.category) + '</p>' +
      '<h3 class="cert-title">' + esc(c.title) + '</h3>' +
      '<p class="cert-issuer">' + esc(c.issuer) + '</p>' +
      '<p class="cert-issuer">' + (c.issueDate ? 'Issued ' + esc(U.fmtMonthYear(c.issueDate)) : '') + '</p>' +
      (c.credentialId ? '<p class="cert-id mono">ID ' + esc(c.credentialId) + '</p>' : '') +
      (shown.length ? '<ul class="chip-row">' + shown.map(function (x) { return '<li class="chip">' + esc(x.skill ? x.skill.name : x.text) + '</li>'; }).join('') +
        (sk.length > shown.length ? '<li class="chip">+' + (sk.length - shown.length) + '</li>' : '') + '</ul>' : '') +
      '<div class="cert-actions">' +
      '<button type="button" class="btn btn-secondary" data-open="' + esc(c.id) + '">View</button>' +
      (c.downloadUrl ? '<a class="btn btn-ghost" href="' + esc(c.downloadUrl) + '" download="' + esc(c.fileName) + '">' + ic('download', 15) + '<span>Download</span></a>' : '') +
      (verify ? '<a class="btn btn-ghost" href="' + esc(verify) + '" target="_blank" rel="noopener noreferrer">' + ic('shield-check', 15) + '<span>Verify</span></a>' : '') +
      (c.builtIn ? '' : '<span class="spacer"></span>' +
        '<button type="button" class="icon-btn" data-owner-only data-edit="' + esc(c.id) + '" aria-label="Edit ' + esc(c.title) + '">' + ic('pencil', 16) + '</button>' +
        '<button type="button" class="icon-btn" data-owner-only data-del="' + esc(c.id) + '" aria-label="Delete ' + esc(c.title) + '">' + ic('trash-2', 16) + '</button>') +
      '</div></div></article>';
  }

  function renderEmpty() {
    const el = $('#certEmpty');
    let html = '';
    if (!all.length) {
      html = owner()
        ? ic('award', 40) + '<h3>No certificates yet</h3><p>Choose a PDF, JPG or PNG, fill in the details, and it appears here and under the skills it covers.</p>' +
          '<button type="button" class="btn btn-primary" data-add-cert>' + ic('plus', 16) + '<span>Add your first certificate</span></button>'
        : ic('award', 40) + '<h3>Certificates are on their way</h3><p>I am still adding my certificates to this page. Please check back soon.</p>';
    } else if (!view.length) {
      html = ic('search', 40) + '<h3>Nothing matches those filters</h3><p>Try another category or a different search.</p>' +
        '<button type="button" class="btn btn-secondary" data-clear-all>Clear filters</button>';
    }
    el.innerHTML = html;
    el.hidden = !html;
  }

  function render() {
    applyFilters();
    renderOwnerBar();
    $('#certFilters').parentElement.hidden = !all.length;
    $('#certCount').hidden = !all.length;
    renderFilters();
    renderActive();
    $('#certGrid').innerHTML = view.map(card).join('');
    $('#certCount').textContent = all.length
      ? (view.length === all.length ? all.length : 'Showing ' + view.length + ' of ' + all.length) + (all.length === 1 ? ' certificate' : ' certificates')
      : '';
    renderEmpty();
  }

  async function refresh() {
    all = await PF.store.listCerts();
    render();
    PF.bus.emit('certs', all);
  }

  /* --------------------------------------------------------------- pdf.js */
  let pdfReady = null;
  function ensurePdf() {
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions.workerSrc) return Promise.resolve(window.pdfjsLib);
    if (!pdfReady) {
      pdfReady = (window.pdfjsLib ? Promise.resolve() : U.loadScript('vendor/pdfjs/pdf.min.js')).then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('vendor/pdfjs/pdf.worker.min.js', document.baseURI).href;
        return window.pdfjsLib;
      }).catch(function (e) { pdfReady = null; throw e; });
    }
    return pdfReady;
  }
  async function drawPage(page, cssWidth, canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: (cssWidth / base.width) * dpr });
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
  }
  function toJpeg(canvas) {
    return new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, 'image/jpeg', 0.82); });
  }

  /* A JPEG preview image stored next to the certificate, so the gallery never has to open every PDF. */
  async function makeThumb(file) {
    const canvas = document.createElement('canvas');
    if (/^image\//.test(file.type)) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise(function (resolve, reject) {
          const i = new Image();
          i.onload = function () { resolve(i); };
          i.onerror = function () { reject(new Error('That image could not be read.')); };
          i.src = url;
        });
        const w = Math.min(720, img.naturalWidth), h = Math.max(1, Math.round((img.naturalHeight * w) / img.naturalWidth));
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return toJpeg(canvas);
      } finally { URL.revokeObjectURL(url); }
    }
    const lib = await ensurePdf();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const page = await doc.getPage(1);
    await drawPage(page, 720, canvas);
    const out = await toJpeg(canvas);
    doc.destroy();
    return out;
  }

  /* ---------------------------------------------------------------- modal */
  function navList() { return view.some(function (c) { return c.id === modalId; }) ? view : all; }

  function modalHTML(c) {
    const list = navList(), i = list.findIndex(function (x) { return x.id === c.id; });
    const sk = certSkills(c), verify = safeUrl(c.credentialUrl);
    return '<div class="cm"><div class="cm-preview" id="cmPreview"></div><div class="cm-info">' +
      '<p class="cm-cat">' + esc(c.category) + '</p><h2 id="certModalTitle">' + esc(c.title) + '</h2>' +
      '<dl class="cm-facts"><div><dt>Issued by</dt><dd>' + esc(c.issuer) + '</dd></div>' +
      (c.issueDate ? '<div><dt>Completed</dt><dd>' + esc(U.fmtDate(c.issueDate)) + '</dd></div>' : '') +
      (c.credentialId ? '<div><dt>Credential ID</dt><dd class="mono">' + esc(c.credentialId) + '</dd></div>' : '') +
      '<div><dt>File</dt><dd>' + (isPdf(c) ? 'PDF' : /png/.test(c.fileType) ? 'PNG image' : 'JPG image') + (c.fileSize ? ', ' + esc(U.fmtBytes(c.fileSize)) : '') + '</dd></div></dl>' +
      (c.description ? '<p class="cm-desc">' + esc(c.description) + '</p>' : '') +
      (sk.length ? '<section class="cm-section"><h3>Skills covered</h3><ul class="chip-row">' + sk.map(function (x) {
        return x.skill ? '<li><button type="button" class="chip" data-skill="' + esc(x.skill.id) + '">' + esc(x.skill.name) + '</button></li>' : '<li class="chip">' + esc(x.text) + '</li>';
      }).join('') + '</ul></section>' : '') +
      '<div class="cm-actions">' +
      (c.downloadUrl ? '<a class="btn btn-primary" href="' + esc(c.downloadUrl) + '" download="' + esc(c.fileName) + '">' + ic('download', 17) + '<span>Download certificate</span></a>' : '') +
      (verify ? '<a class="btn btn-secondary" href="' + esc(verify) + '" target="_blank" rel="noopener noreferrer">' + ic('shield-check', 17) + '<span>Verify credential</span></a>' : '') +
      (c.builtIn ? '' : '<button type="button" class="btn btn-ghost" data-owner-only data-edit="' + esc(c.id) + '">' + ic('pencil', 16) + '<span>Edit</span></button>' +
        '<button type="button" class="btn btn-ghost" data-owner-only data-del="' + esc(c.id) + '">' + ic('trash-2', 16) + '<span>Delete</span></button>') +
      '</div>' +
      (list.length > 1 ? '<div class="cm-pager"><span>' + (i + 1) + ' of ' + list.length + '</span><div>' +
        '<button type="button" class="icon-btn" data-step="-1" aria-label="Previous certificate">' + ic('chevron-left', 18) + '</button>' +
        '<button type="button" class="icon-btn" data-step="1" aria-label="Next certificate">' + ic('chevron-right', 18) + '</button></div></div>' : '') +
      '</div></div>';
  }

  async function mountPreview(c, token) {
    const host = $('#cmPreview');
    if (!host || !c.fileUrl) { if (host) host.innerHTML = '<p class="pdf-status">This certificate has no file attached.</p>'; return; }
    if (!isPdf(c)) {
      host.innerHTML = '<img src="' + esc(c.fileUrl) + '" alt="' + esc('Certificate: ' + c.title) + '">';
      return;
    }
    host.innerHTML = '<p class="pdf-status" role="status">Loading certificate</p>';
    try {
      const lib = await ensurePdf();
      const doc = await lib.getDocument({ url: c.fileUrl }).promise;
      if (token !== previewToken) { doc.destroy(); return; }
      const pages = Math.min(doc.numPages, 4);
      const box = document.createElement('div');
      box.className = 'pdf-pages';
      const width = Math.min(Math.max(host.clientWidth - 56, 320), 1000);
      for (let n = 1; n <= pages; n++) {
        const page = await doc.getPage(n);
        if (token !== previewToken) { doc.destroy(); return; }
        const canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Certificate page ' + n + ' of ' + doc.numPages);
        await drawPage(page, width, canvas);
        box.appendChild(canvas);
      }
      if (token !== previewToken) { doc.destroy(); return; }
      host.innerHTML = '';
      host.appendChild(box);
    } catch (e) {
      if (token !== previewToken) return;
      console.warn('[certs] pdf.js preview failed, using the browser viewer', e);
      host.innerHTML = '<iframe class="pdf-fallback" title="' + esc('Certificate: ' + c.title) + '" src="' + esc(c.fileUrl) + '"></iframe>';
    }
  }

  function open(id) {
    const c = byId(id);
    if (!c) return;
    modalId = id;
    const token = ++previewToken;
    $('#certBody').innerHTML = modalHTML(c);
    PF.ui.open('certModal');
    $('#certModal').scrollTop = 0;
    mountPreview(c, token);
  }
  function step(delta) {
    const list = navList();
    const i = list.findIndex(function (c) { return c.id === modalId; });
    if (i < 0 || list.length < 2) return;
    open(list[(i + delta + list.length) % list.length].id);
    const btn = $('[data-step="' + delta + '"]', $('#certBody'));
    if (btn) btn.focus();
  }

  /* --------------------------------------------------------- delete flow */
  async function remove(c) {
    const ok = await PF.ui.confirm({
      title: 'Delete certificate?',
      text: '“' + c.title + '” and its file will be removed permanently.',
      confirmLabel: 'Delete'
    });
    if (!ok) return;
    try {
      await PF.store.deleteCert(c);
      PF.ui.close('certModal');
      await refresh();
      PF.ui.toast('Certificate deleted.', 'ok');
    } catch (e) { PF.ui.toast(e.message, 'error'); }
  }

  /* ------------------------------------------------------------ form: tags */
  function renderTags() {
    $('#cfSkillList').innerHTML = tags.map(function (t, i) {
      return '<li class="' + (index.match(t) ? '' : 'is-custom') + '"><span>' + esc(t) + '</span>' +
        '<button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(t) + '">' + ic('x', 12) + '</button></li>';
    }).join('');
  }
  function addTag(raw) {
    raw = String(raw || '').replace(/[,;]+$/, '').trim();
    if (!raw) return;
    const sk = index.match(raw);
    const name = sk ? sk.name : raw;
    if (tags.some(function (t) { return U.norm(t) === U.norm(name); })) return;
    tags.push(name);
    renderTags();
  }

  /* ------------------------------------------------------- form: helpers */
  function fieldError(input, msg) {
    const f = input.closest('.field') || input.parentElement;
    let p = f.querySelector('.field-error');
    if (!msg) {
      if (p) p.remove();
      f.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      return;
    }
    if (!p) { p = document.createElement('p'); p.className = 'field-error'; p.id = input.id + 'Err'; f.appendChild(p); }
    p.textContent = msg;
    f.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', p.id);
  }
  function fileProblem(msg) {
    const el = $('#cfFileErr');
    el.textContent = msg || '';
    el.hidden = !msg;
  }
  function revokePreviews() {
    previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    previewUrls = [];
  }
  function normaliseFile(file) {
    const t = PF.store.typeFromName(file.name) || file.type;
    return file.type === t ? file : new File([file], file.name, { type: t });
  }

  function showFile(info) {
    $('#dzEmpty').hidden = !!info;
    $('#dzSelected').hidden = !info;
    if (!info) return;
    $('#dzName').textContent = info.name;
    $('#dzSize').textContent = info.note || ((info.type === 'application/pdf' ? 'PDF' : 'Image') + ', ' + U.fmtBytes(info.size));
    const t = $('#dzThumb');
    if (info.thumbUrl) t.innerHTML = '<img src="' + esc(info.thumbUrl) + '" alt="">';
    else t.innerHTML = ic(info.type === 'application/pdf' ? 'file-text' : 'image', 26);
  }

  function handleFile(raw) {
    fileProblem('');
    if (!raw) return;
    const file = normaliseFile(raw);
    if (OK_TYPES.indexOf(file.type) < 0) { fileProblem('Choose a PDF, JPG or PNG file.'); return; }
    if (file.size > MAX_BYTES) { fileProblem('That file is ' + U.fmtBytes(file.size) + '. The limit is 10 MB.'); return; }
    revokePreviews();
    const thumbPromise = makeThumb(file).catch(function (e) { console.warn('[certs] thumbnail skipped', e); return null; });
    pending = { file: file, thumb: thumbPromise };
    showFile({ name: file.name, size: file.size, type: file.type });
    thumbPromise.then(function (blob) {
      if (!pending || pending.file !== file || !blob) return;
      const u = URL.createObjectURL(blob);
      previewUrls.push(u);
      showFile({ name: file.name, size: file.size, type: file.type, thumbUrl: u });
    });
    const title = $('#cfTitle');
    if (!title.value.trim()) {
      title.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  function openForm(cert) {
    editing = cert || null;
    pending = null;
    tags = cert ? (cert.skills || []).slice() : [];
    const form = $('#certForm');
    form.reset();
    $$('.field .field-error', form).forEach(function (p) { p.remove(); });
    $$('.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
    $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
    fileProblem('');
    $('#cfError').hidden = true;
    revokePreviews();

    $('#certFormTitle').textContent = cert ? 'Edit certificate' : 'Add certificate';
    $('#cfCategory').innerHTML = '<option value="" disabled selected>Choose a category</option>' +
      categories().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    $('#skillOptions').innerHTML = index.list.map(function (s) { return '<option value="' + esc(s.name) + '"></option>'; }).join('');

    if (cert) {
      $('#cfTitle').value = cert.title;
      $('#cfIssuer').value = cert.issuer;
      $('#cfDate').value = cert.issueDate || '';
      $('#cfCategory').value = cert.category;
      $('#cfCredId').value = cert.credentialId || '';
      $('#cfUrl').value = cert.credentialUrl || '';
      $('#cfDesc').value = cert.description || '';
      showFile({ name: cert.fileName, size: cert.fileSize, type: cert.fileType, thumbUrl: cert.thumbUrl, note: 'Current file. Choose a different file to replace it.' });
    } else {
      showFile(null);
    }
    renderTags();
    PF.ui.open('certFormDialog');
    (cert ? $('#cfTitle') : $('#dropzone')).focus();
  }

  async function submitForm(e) {
    e.preventDefault();
    const form = e.currentTarget;
    addTag($('#cfSkillInput').value);
    $('#cfSkillInput').value = '';
    $$('.field .field-error', form).forEach(function (p) { p.remove(); });
    $$('.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
    $('#cfError').hidden = true;

    const f = {
      title: $('#cfTitle'), issuer: $('#cfIssuer'), date: $('#cfDate'), category: $('#cfCategory'),
      credId: $('#cfCredId'), url: $('#cfUrl'), desc: $('#cfDesc')
    };
    let firstBad = null;
    function bad(input, msg) { fieldError(input, msg); if (!firstBad) firstBad = input; }
    if (!f.title.value.trim()) bad(f.title, 'Enter the certificate title.');
    if (!f.issuer.value.trim()) bad(f.issuer, 'Enter who issued it.');
    if (!f.date.value) bad(f.date, 'Choose the completion date.');
    if (!f.category.value) bad(f.category, 'Choose a category.');
    const url = f.url.value.trim();
    if (url && !safeUrl(url)) bad(f.url, 'Use a full link that starts with https://');
    if (!editing && !pending) {
      fileProblem('Choose the certificate file to upload.');
      if (!firstBad) firstBad = $('#dropzone');
    }
    if (firstBad) { firstBad.focus(); return; }

    const meta = {
      title: f.title.value.trim(), issuer: f.issuer.value.trim(), issueDate: f.date.value, category: f.category.value,
      credentialId: f.credId.value.trim(), credentialUrl: url, skills: tags.slice(), description: f.desc.value.trim()
    };
    const btn = $('#cfSubmit');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    try {
      const thumbBlob = pending ? await pending.thumb : null;
      const saved = await PF.store.saveCert(meta, pending ? pending.file : null, thumbBlob, editing);
      const wasEdit = !!editing;
      PF.ui.close('certFormDialog');
      state.category = 'all'; state.query = ''; $('#certSearch').value = '';
      await refresh();
      PF.ui.toast(wasEdit ? 'Certificate updated.' : 'Certificate added to the gallery.', 'ok');
      if (wasEdit && $('#certModal').open) open(saved.id);
    } catch (ex) {
      const box = $('#cfError');
      box.textContent = ex.message;
      box.hidden = false;
    } finally {
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
    }
  }

  /* ----------------------------------------------------------------- init */
  function bindForm() {
    const dz = $('#dropzone'), input = $('#certFile');
    dz.addEventListener('click', function (e) { if (!e.target.closest('#dzChange')) input.click(); });
    $('#dzChange').addEventListener('click', function (e) { e.stopPropagation(); input.click(); });
    dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', function () { handleFile(input.files && input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove('is-over'); }); });
    dz.addEventListener('drop', function (e) { handleFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });

    const tagInput = $('#cfSkillInput');
    tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput.value); tagInput.value = ''; }
      else if (e.key === 'Backspace' && !tagInput.value && tags.length) { tags.pop(); renderTags(); }
    });
    tagInput.addEventListener('input', function (e) {
      /* picking an entry from the suggestion list fires an input event without a typed character */
      if (!e.inputType || e.inputType === 'insertReplacementText') { addTag(tagInput.value); tagInput.value = ''; }
    });
    tagInput.addEventListener('blur', function () { addTag(tagInput.value); tagInput.value = ''; });
    $('#cfSkillList').addEventListener('click', function (e) {
      const b = e.target.closest('[data-rm]');
      if (b) { tags.splice(+b.dataset.rm, 1); renderTags(); tagInput.focus(); }
    });
    $('#cfSkills').addEventListener('click', function (e) { if (e.target === e.currentTarget) tagInput.focus(); });

    $('#certForm').addEventListener('submit', submitForm);
    $('#certForm').addEventListener('input', function (e) { if (e.target.closest('.field.has-error')) fieldError(e.target, ''); });
    $('#certFormDialog').addEventListener('close', function () { revokePreviews(); pending = null; });
  }

  function init(ctx) {
    index = ctx.index;
    all = ctx.certs || [];

    $('#certFilters').addEventListener('click', function (e) {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      state.category = b.dataset.cat;
      render();
      const again = $('#certFilters [data-cat="' + state.category + '"]');
      if (again) again.focus();
    });
    $('#certSearch').addEventListener('input', U.debounce(function (e) { state.query = e.target.value; render(); }, 160));
    $('#certActiveFilter').addEventListener('click', function (e) {
      if (e.target.closest('[data-clear-skill]')) { state.skillId = null; render(); }
    });

    function click(e) {
      const o = e.target.closest('[data-open]'), ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (o) { open(o.dataset.open); return; }
      if (e.target.closest('[data-add-cert]')) { openForm(null); return; }
      if (e.target.closest('[data-clear-all]')) {
        state.category = 'all'; state.skillId = null; state.query = ''; $('#certSearch').value = ''; render(); return;
      }
      if (ed) { const c = byId(ed.dataset.edit); if (c) { PF.ui.close('certModal'); openForm(c); } return; }
      if (del) { const c = byId(del.dataset.del); if (c) remove(c); }
    }
    $('#certifications').addEventListener('click', click);
    $('#certBody').addEventListener('click', function (e) {
      const s = e.target.closest('[data-skill]'), st = e.target.closest('[data-step]');
      if (s) { PF.ui.close('certModal'); PF.skills.open(s.dataset.skill); return; }
      if (st) { step(+st.dataset.step); return; }
      click(e);
    });
    $('#certModal').addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
    $('#certModal').addEventListener('close', function () { previewToken++; });

    bindForm();
    PF.bus.on('owner', function () { render(); });
    render();
  }

  function filterBySkill(id) {
    state.skillId = id; state.category = 'all'; state.query = '';
    $('#certSearch').value = '';
    render();
  }

  PF.certs = {
    init: init, refresh: refresh, open: open, openForm: openForm,
    filterBySkill: filterBySkill, forSkill: forSkill,
    list: function () { return all.slice(); }
  };
})();
