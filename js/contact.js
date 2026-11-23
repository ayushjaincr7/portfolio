/* ==========================================================================
   contact.js: contact form with inline validation.
   - If data/site.js sets contact.formEndpoint (Formspree, Web3Forms, Getform ...)
     the message is posted there as JSON.
   - Otherwise the visitor's email app opens with the message filled in (mailto).
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $ } = U;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, msg) {
    const err = $('#' + input.id + 'Err');
    const field = input.closest('.field');
    if (msg) {
      err.textContent = msg; err.hidden = false;
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
    } else {
      err.hidden = true; err.textContent = '';
      field.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
    }
  }
  function status(text, kind) {
    const el = $('#contactStatus');
    el.textContent = text || '';
    el.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  function init() {
    const form = $('#contactForm');
    if (!form) return;
    const site = PF.data.site, cfg = site.contact || {};
    const name = $('#cName'), email = $('#cEmail'), msg = $('#cMessage');

    function validate() {
      let first = null;
      function check(input, ok, text) { setError(input, ok ? '' : text); if (!ok && !first) first = input; }
      check(name, name.value.trim().length > 0, 'Enter your name.');
      check(email, EMAIL_RE.test(email.value.trim()), 'Enter a valid email address so I can reply.');
      check(msg, msg.value.trim().length >= 10, 'Write a message of at least 10 characters.');
      return first;
    }

    [name, email, msg].forEach(function (i) {
      i.addEventListener('input', function () { if (i.getAttribute('aria-invalid')) setError(i, ''); });
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status('');
      if (form.elements.website && form.elements.website.value) { status('Thanks, your message is on its way.', 'ok'); return; } // honeypot
      const bad = validate();
      if (bad) { bad.focus(); status('Please fix the highlighted fields.', 'error'); return; }

      const payload = { name: name.value.trim(), email: email.value.trim(), message: msg.value.trim() };
      const subject = (cfg.subjectPrefix || 'Portfolio enquiry') + ' from ' + payload.name;
      const btn = $('#cSubmit');

      if (cfg.formEndpoint) {
        btn.setAttribute('aria-busy', 'true');
        try {
          const res = await fetch(cfg.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.assign({}, cfg.extraFields || {}, payload, { subject: subject }))
          });
          if (!res.ok) throw new Error('The form service answered ' + res.status + '.');
          form.reset();
          status('Thanks, your message is on its way. I will reply by email.', 'ok');
        } catch (ex) {
          status('The message could not be sent (' + ex.message + ') Please email me directly at ' + site.email + '.', 'error');
        } finally { btn.removeAttribute('aria-busy'); }
        return;
      }

      const body = payload.message + '\n\n' + payload.name + '\n' + payload.email;
      window.location.href = 'mailto:' + encodeURIComponent(site.email).replace('%40', '@') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status('Opening your email app. If nothing opens, write to ' + site.email + ' directly.', 'ok');
    });
  }

  PF.contact = { init: init };
})();
