/* ==========================================================================
   certs-store.js: persistence for certificates and skill levels, plus owner auth.

   Two interchangeable backends behind one API (PF.store):

     local  - no Supabase keys in data/site.js. Certificates live in THIS browser's
              IndexedDB, skill levels in localStorage. Great for trying the site out.
     cloud  - Supabase keys present. Certificate files go to Supabase Storage, metadata
              to a Postgres table, skill levels to a second table. Everyone sees them;
              only the signed-in owner can change them (enforced by supabase/schema.sql).

   Certificate shape used everywhere in the UI:
     { id, title, issuer, issueDate 'YYYY-MM-DD', category, credentialId, credentialUrl,
       skills: string[], description, fileName, fileType, fileSize,
       fileUrl, downloadUrl, thumbUrl, builtIn?, filePath?, thumbPath? }
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;

  const cfg = (PF.data.site && PF.data.site.supabase) || {};
  const CLOUD = !!(cfg.url && cfg.anonKey);
  const TABLE = cfg.table || 'certificates';
  const BUCKET = cfg.bucket || 'certificates';
  const LEVELS_TABLE = cfg.levelsTable || 'skill_levels';

  let client = null;
  let initError = '';
  let volatile = false; // true when the browser blocks IndexedDB, so uploads vanish on reload

  /* ------------------------------------------------------------ owner state */
  let owner = false;
  const ownerListeners = [];
  function setOwner(v) {
    v = !!v;
    if (v === owner) return;
    owner = v;
    ownerListeners.slice().forEach(function (fn) { try { fn(owner); } catch (e) { console.error(e); } });
  }

  /* ---------------------------------------------------------------- helpers */
  function typeFromName(name) {
    const m = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(name || '');
    const ext = m ? m[1].toLowerCase() : '';
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    return '';
  }
  function safeName(name) {
    return String(name || 'certificate').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(-80) || 'certificate';
  }
  function friendly(err) {
    const msg = (err && (err.message || err.error_description || err.msg)) || String(err || 'Something went wrong.');
    const code = err && (err.code || err.statusCode || err.status);
    if (/invalid login credentials/i.test(msg)) return 'That email and password do not match.';
    if (/email not confirmed/i.test(msg)) return 'Confirm your email address first (check your inbox), then sign in again.';
    if (/row-level security|violates row-level|permission denied|not authorized|unauthorized/i.test(msg) || code === '42501' || code === 401 || code === 403 || code === '403') {
      return 'The server refused this change. Sign in as the owner account and make sure supabase/schema.sql has been run.';
    }
    if (/bucket not found/i.test(msg)) return 'The storage bucket "' + BUCKET + '" was not found. Run supabase/schema.sql or create the bucket.';
    if (/does not exist|schema cache|could not find the table/i.test(msg)) return 'A table is missing. Run supabase/schema.sql in the Supabase SQL editor.';
    if (/too large|exceeded the maximum|maximum allowed size/i.test(msg)) return 'That file is larger than the storage bucket allows.';
    if (/quota/i.test(msg)) return 'This browser has no storage space left for that file. Delete something or use a smaller file.';
    if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'Could not reach Supabase. Check your connection and the URL in data/site.js.';
    return msg;
  }

  /* Certificates committed with the site (data/certificates.js, files in /assets/certs). */
  function builtIns() {
    return (PF.data.certBuiltIn || []).filter(function (c) { return c && c.title; }).map(function (c) {
      const type = c.fileType || typeFromName(c.fileUrl);
      return {
        id: c.id || 'builtin-' + U.slug(c.title),
        title: c.title,
        issuer: c.issuer || '',
        issueDate: c.issueDate || '',
        category: c.category || 'Professional Development',
        credentialId: c.credentialId || '',
        credentialUrl: c.credentialUrl || '',
        skills: c.skills || [],
        description: c.description || '',
        fileName: (c.fileUrl || '').split('/').pop() || 'certificate',
        fileType: type,
        fileSize: 0,
        fileUrl: c.fileUrl || '',
        downloadUrl: c.fileUrl || '',
        thumbUrl: c.thumbUrl || (/^image\//.test(type) ? c.fileUrl : ''),
        builtIn: true
      };
    });
  }
  function sortCerts(list) {
    return list.slice().sort(function (a, b) {
      return (b.issueDate || '').localeCompare(a.issueDate || '') || a.title.localeCompare(b.title);
    });
  }

  /* ================================================================= LOCAL */
  const LOCAL_DB = 'pf-portfolio';
  let db = null;
  const memory = new Map(); // fallback when IndexedDB is unavailable
  const blobUrls = new Map(); // id -> { file, thumb, key }

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
      const rq = indexedDB.open(LOCAL_DB, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore('certs', { keyPath: 'id' }); };
      rq.onsuccess = function () { resolve(rq.result); };
      rq.onerror = function () { reject(rq.error); };
      rq.onblocked = function () { reject(new Error('IndexedDB blocked')); };
    });
  }
  function idbRun(mode, fn) {
    return new Promise(function (resolve, reject) {
      const t = db.transaction('certs', mode);
      const store = t.objectStore('certs');
      let out;
      const rq = fn(store);
      if (rq) rq.onsuccess = function () { out = rq.result; };
      t.oncomplete = function () { resolve(out); };
      t.onerror = function () { reject(t.error || (rq && rq.error)); };
      t.onabort = function () { reject(t.error || new Error('Transaction aborted')); };
    });
  }
  const localDb = {
    all: function () { return db ? idbRun('readonly', function (s) { return s.getAll(); }) : Promise.resolve(Array.from(memory.values())); },
    get: function (id) { return db ? idbRun('readonly', function (s) { return s.get(id); }) : Promise.resolve(memory.get(id)); },
    put: function (rec) { if (!db) { memory.set(rec.id, rec); return Promise.resolve(); } return idbRun('readwrite', function (s) { return s.put(rec); }); },
    del: function (id) { if (!db) { memory.delete(id); return Promise.resolve(); } return idbRun('readwrite', function (s) { return s.delete(id); }); }
  };

  function revokeUrls(id) {
    const u = blobUrls.get(id);
    if (!u) return;
    if (u.fileUrl) URL.revokeObjectURL(u.fileUrl);
    if (u.thumbUrl) URL.revokeObjectURL(u.thumbUrl);
    blobUrls.delete(id);
  }
  function localToCert(rec) {
    let u = blobUrls.get(rec.id);
    if (!u || u.key !== rec.updatedAt) {
      revokeUrls(rec.id);
      u = {
        key: rec.updatedAt,
        fileUrl: rec.file ? URL.createObjectURL(rec.file) : '',
        thumbUrl: rec.thumb ? URL.createObjectURL(rec.thumb) : ''
      };
      blobUrls.set(rec.id, u);
    }
    const isImg = /^image\//.test(rec.fileType || '');
    return {
      id: rec.id, title: rec.title, issuer: rec.issuer, issueDate: rec.issueDate, category: rec.category,
      credentialId: rec.credentialId || '', credentialUrl: rec.credentialUrl || '', skills: rec.skills || [],
      description: rec.description || '', fileName: rec.fileName, fileType: rec.fileType, fileSize: rec.fileSize || 0,
      fileUrl: u.fileUrl, downloadUrl: u.fileUrl, thumbUrl: u.thumbUrl || (isImg ? u.fileUrl : '')
    };
  }
  async function localList() {
    const recs = await localDb.all();
    return recs.map(localToCert);
  }
  async function localSave(meta, file, thumb, existing) {
    const prev = existing ? await localDb.get(existing.id) : null;
    const rec = {
      id: existing ? existing.id : U.uid(),
      title: meta.title, issuer: meta.issuer, issueDate: meta.issueDate, category: meta.category,
      credentialId: meta.credentialId, credentialUrl: meta.credentialUrl, skills: meta.skills, description: meta.description,
      fileName: file ? file.name : prev && prev.fileName,
      fileType: file ? file.type || typeFromName(file.name) : prev && prev.fileType,
      fileSize: file ? file.size : prev && prev.fileSize,
      file: file || (prev && prev.file) || null,
      thumb: file ? thumb || null : (prev && prev.thumb) || null,
      createdAt: prev ? prev.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    await localDb.put(rec);
    return localToCert(rec);
  }
  async function localRemove(cert) {
    await localDb.del(cert.id);
    revokeUrls(cert.id);
  }

  /* ================================================================= CLOUD */
  function cloudToCert(r) {
    const bucket = client.storage.from(BUCKET);
    const fileUrl = r.file_path ? bucket.getPublicUrl(r.file_path).data.publicUrl : '';
    const downloadUrl = r.file_path ? bucket.getPublicUrl(r.file_path, { download: r.file_name || true }).data.publicUrl : '';
    const thumbUrl = r.thumb_path ? bucket.getPublicUrl(r.thumb_path).data.publicUrl : (/^image\//.test(r.file_type || '') ? fileUrl : '');
    return {
      id: r.id, title: r.title, issuer: r.issuer, issueDate: r.issue_date || '', category: r.category,
      credentialId: r.credential_id || '', credentialUrl: r.credential_url || '', skills: r.skills || [],
      description: r.description || '', fileName: r.file_name || 'certificate', fileType: r.file_type || '',
      fileSize: r.file_size || 0, fileUrl: fileUrl, downloadUrl: downloadUrl, thumbUrl: thumbUrl,
      filePath: r.file_path, thumbPath: r.thumb_path || ''
    };
  }
  async function cloudInit() {
    if (!window.supabase) await U.loadScript('vendor/supabase/supabase.js');
    client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    const res = await client.auth.getSession();
    setOwner(!!(res && res.data && res.data.session));
    client.auth.onAuthStateChange(function (_evt, session) { setOwner(!!session); });
  }
  async function cloudList() {
    const res = await client.from(TABLE).select('*').order('issue_date', { ascending: false });
    if (res.error) throw res.error;
    return (res.data || []).map(cloudToCert);
  }
  async function cloudSave(meta, file, thumb, existing) {
    const id = existing ? existing.id : U.uid();
    const bucket = client.storage.from(BUCKET);
    const uploaded = [];
    const row = {
      title: meta.title, issuer: meta.issuer, issue_date: meta.issueDate, category: meta.category,
      credential_id: meta.credentialId || null, credential_url: meta.credentialUrl || null,
      skills: meta.skills, description: meta.description || null
    };
    let oldPaths = [];
    try {
      if (file) {
        const stamp = Date.now();
        const type = file.type || typeFromName(file.name);
        const filePath = id + '/' + stamp + '-' + safeName(file.name);
        let up = await bucket.upload(filePath, file, { contentType: type, cacheControl: '31536000', upsert: false });
        if (up.error) throw up.error;
        uploaded.push(filePath);
        row.file_path = filePath; row.file_name = file.name; row.file_type = type; row.file_size = file.size;
        if (thumb) {
          const thumbPath = id + '/' + stamp + '-thumb.jpg';
          up = await bucket.upload(thumbPath, thumb, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
          if (up.error) throw up.error;
          uploaded.push(thumbPath);
          row.thumb_path = thumbPath;
        } else {
          row.thumb_path = null;
        }
        if (existing) oldPaths = [existing.filePath, existing.thumbPath].filter(Boolean);
      }
      const q = existing
        ? client.from(TABLE).update(row).eq('id', id).select().single()
        : client.from(TABLE).insert(Object.assign({ id: id }, row)).select().single();
      const res = await q;
      if (res.error) throw res.error;
      if (oldPaths.length) { try { await bucket.remove(oldPaths); } catch (e) { /* orphaned files are harmless */ } }
      return cloudToCert(res.data);
    } catch (e) {
      if (uploaded.length) { try { await bucket.remove(uploaded); } catch (e2) { /* ignore */ } }
      throw e;
    }
  }
  async function cloudRemove(cert) {
    const res = await client.from(TABLE).delete().eq('id', cert.id).select('id');
    if (res.error) throw res.error;
    if (!res.data || !res.data.length) throw new Error('row-level security: nothing was deleted');
    const paths = [cert.filePath, cert.thumbPath].filter(Boolean);
    if (paths.length) { try { await client.storage.from(BUCKET).remove(paths); } catch (e) { /* ignore */ } }
  }

  /* ======================================================= skill levels */
  const LEVELS_KEY = 'pf.skillLevels';
  async function loadLevels() {
    if (CLOUD && client) {
      const res = await client.from(LEVELS_TABLE).select('skill_id, level');
      if (res.error) throw res.error;
      const out = {};
      (res.data || []).forEach(function (r) { out[r.skill_id] = r.level; });
      return out;
    }
    return U.storage.get(LEVELS_KEY, {}) || {};
  }
  async function saveLevel(skillId, level) {
    level = Math.max(0, Math.min(100, Math.round(level)));
    if (CLOUD && client) {
      const res = await client.from(LEVELS_TABLE).upsert({ skill_id: skillId, level: level, updated_at: new Date().toISOString() });
      if (res.error) throw res.error;
      return;
    }
    const all = U.storage.get(LEVELS_KEY, {}) || {};
    all[skillId] = level;
    if (!U.storage.set(LEVELS_KEY, all)) throw new Error('This browser would not save the change (storage is blocked).');
  }

  /* ------------------------------------------------------------------- auth */
  const LOCAL_OWNER_KEY = 'pf.localOwner';
  const auth = {
    isOwner: function () { return owner; },
    onChange: function (fn) { ownerListeners.push(fn); },
    signIn: async function (email, password) {
      if (!CLOUD) { U.storage.set(LOCAL_OWNER_KEY, true); setOwner(true); return; }
      if (!client) throw new Error(initError || 'Supabase is not ready yet.');
      const res = await client.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw new Error(friendly(res.error));
      setOwner(true);
    },
    signOut: async function () {
      if (!CLOUD) { U.storage.del(LOCAL_OWNER_KEY); setOwner(false); return; }
      if (client) { try { await client.auth.signOut(); } catch (e) { /* session is cleared locally either way */ } }
      setOwner(false);
    }
  };

  /* -------------------------------------------------------------- public API */
  PF.store = {
    mode: CLOUD ? 'cloud' : 'local',
    get error() { return initError; },
    get volatile() { return volatile; },
    auth: auth,
    friendly: friendly,
    typeFromName: typeFromName,

    init: async function () {
      if (CLOUD) {
        try { await cloudInit(); } catch (e) { console.error('[store] cloud init failed', e); initError = friendly(e); client = null; }
      } else {
        try { db = await idbOpen(); } catch (e) { db = null; volatile = true; }
        setOwner(!!U.storage.get(LOCAL_OWNER_KEY, false));
      }
    },

    listCerts: async function () {
      let own = [];
      if (CLOUD) {
        if (client) {
          try { own = await cloudList(); } catch (e) { initError = friendly(e); console.error('[store] list failed', e); }
        }
      } else {
        try { own = await localList(); } catch (e) { initError = friendly(e); console.error('[store] list failed', e); }
      }
      return sortCerts(builtIns().concat(own));
    },

    saveCert: async function (meta, file, thumb, existing) {
      try {
        return CLOUD ? await cloudSave(meta, file, thumb, existing) : await localSave(meta, file, thumb, existing);
      } catch (e) { throw new Error(friendly(e)); }
    },

    deleteCert: async function (cert) {
      try {
        if (CLOUD) await cloudRemove(cert); else await localRemove(cert);
      } catch (e) { throw new Error(friendly(e)); }
    },

    loadLevels: function () { return loadLevels().catch(function (e) { console.error('[store] levels', e); return {}; }); },
    saveLevel: function (id, level) { return saveLevel(id, level).catch(function (e) { throw new Error(friendly(e)); }); }
  };
})();
