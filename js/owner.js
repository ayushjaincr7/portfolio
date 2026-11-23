/* ==========================================================================
   owner.js: the "Owner login" dialog and owner-mode switch.
   Owner mode unlocks the certificate manager and the skill-level sliders.
     cloud: real Supabase sign-in (the database policies decide what is allowed)
     local: a plain toggle, because everything is stored only in this browser anyway
   ========================================================================== */
(function () {
  'use strict';
  const PF = window.PF;
  const U = PF.util;
  const { $, esc } = U;

  function isOwner() { return PF.store.auth.isOwner(); }

  function body() {
    const cloud = PF.store.mode === 'cloud';
    if (isOwner()) {
      return '<div class="dlg-h">Owner mode is on</div>' +
        '<p class="dlg-p">You can add, edit and delete certificates and adjust skill levels. ' +
        (cloud ? 'Changes are saved to Supabase and visible to every visitor.' : 'Changes are saved in this browser only. Add your Supabase keys to publish them for everyone.') + '</p>' +
        '<div class="dlg-actions"><button type="button" class="btn btn-ghost" data-close>Close</button>' +
        '<button type="button" class="btn btn-secondary" id="ownerSignOut">' + PF.ui.icon('log-out', 16) + '<span>Turn off owner mode</span></button></div>';
    }
    if (cloud) {
      const bad = PF.store.error ? '<p class="form-error" role="alert">' + esc(PF.store.error) + '</p>' : '';
      return '<form id="ownerForm" novalidate><div class="dlg-h">Owner sign in</div>' +
        '<p class="dlg-p">Sign in with the account you created in Supabase to manage certificates and skill levels.</p>' +
        '<div class="dlg-body">' + bad +
        '<div class="field"><label for="ownerEmail">Email</label><input id="ownerEmail" type="email" autocomplete="username" required></div>' +
        '<div class="field"><label for="ownerPassword">Password</label><input id="ownerPassword" type="password" autocomplete="current-password" required></div>' +
        '<p class="form-error" id="ownerError" role="alert" hidden></p></div>' +
        '<div class="dlg-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button>' +
        '<button type="submit" class="btn btn-primary" id="ownerSubmit"><span>Sign in</span></button></div></form>';
    }
    return '<div class="dlg-h">Owner mode</div>' +
      '<p class="dlg-p">Supabase is not connected yet, so certificates you add are saved in this browser only and nobody else sees them. ' +
      'Turn owner mode on to try the certificate manager and the skill sliders.</p>' +
      '<p class="dlg-p fine">To publish for every visitor, add your Supabase URL and key in <span class="mono">data/site.js</span>. The README walks through it.</p>' +
      '<div class="dlg-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button>' +
      '<button type="button" class="btn btn-primary" id="ownerEnter">Turn on owner mode</button></div>';
  }

  function openDialog() {
    const host = $('#ownerBody');
    host.innerHTML = body();
    const dlg = PF.ui.open('ownerDialog');
    const first = host.querySelector('input, #ownerEnter, #ownerSignOut');
    if (first) first.focus();
    return dlg;
  }

  function sync() {
    const on = isOwner();
    document.body.classList.toggle('is-owner', on);
    const pill = $('#ownerPill');
    pill.hidden = !on;
    $('#ownerPillText').textContent = PF.store.mode === 'cloud' ? 'Owner mode' : 'Owner mode (this browser only)';
    const label = $('#ownerLogin span');
    if (label) label.textContent = on ? 'Owner mode' : 'Owner login';
    PF.bus.emit('owner', on);
  }

  function init() {
    PF.store.auth.onChange(function () { sync(); });
    sync();

    $('#ownerLogin').addEventListener('click', openDialog);
    $('#ownerExit').addEventListener('click', function () {
      PF.store.auth.signOut().then(function () { PF.ui.toast('Owner mode is off.'); });
    });
    if (location.hash === '#owner') openDialog();

    const host = $('#ownerBody');
    host.addEventListener('click', function (e) {
      if (e.target.closest('#ownerEnter')) {
        PF.store.auth.signIn().then(function () { PF.ui.close('ownerDialog'); PF.ui.toast('Owner mode is on.', 'ok'); });
      } else if (e.target.closest('#ownerSignOut')) {
        PF.store.auth.signOut().then(function () { PF.ui.close('ownerDialog'); PF.ui.toast('Owner mode is off.'); });
      }
    });
    host.addEventListener('submit', function (e) {
      if (e.target.id !== 'ownerForm') return;
      e.preventDefault();
      const email = $('#ownerEmail').value.trim();
      const pass = $('#ownerPassword').value;
      const err = $('#ownerError');
      const btn = $('#ownerSubmit');
      err.hidden = true;
      if (!email || !pass) { err.textContent = 'Enter your email and password.'; err.hidden = false; return; }
      btn.setAttribute('aria-busy', 'true');
      PF.store.auth.signIn(email, pass).then(function () {
        PF.ui.close('ownerDialog');
        PF.ui.toast('Signed in. Owner mode is on.', 'ok');
      }).catch(function (ex) {
        err.textContent = ex.message; err.hidden = false;
      }).then(function () { btn.removeAttribute('aria-busy'); });
    });
  }

  PF.owner = { init: init, isOwner: isOwner, open: openDialog };
})();
