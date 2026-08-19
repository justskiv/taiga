/* newsletter — behaviour for the subscription UI: the form's state machine, the
   header popover, the dismissible in-article block and the subscribe page's
   #form anchor. One delegated handler set, no per-block glue: a page may carry
   the header form, an article block and a prose form at once, and every lookup
   is scoped to the .nl-unit (form + note + message) around the form.

   Where the form posts is the site's decision, handed over by the js-bridge as
   window.TAIGA_NL (layouts/_partials/newsletter/js-config.html):

     mode "worker" — POST {endpoint} with {email, list, website, ts_token};
                     202 means "accepted, confirmation letter sent".
     mode "direct" — POST straight at listmonk's public subscription endpoint
                     with {email, list_uuids:[…]}; a degradation path for local
                     development and for a worker that is down, with no bot
                     check of our own in front of it.

   Whatever the mode, the reader is told the same three things: accepted, a typo,
   or "didn't work". The address is never confirmed or denied as already known —
   double opt-in makes that the letter's job, and saying it here would leak who
   is subscribed. Two of those three carry a quieter second line (`hint` below):
   where the letter went if it is not in the inbox, and who to write to when the
   error is not the kind another attempt clears. */
import { I18N } from './i18n.js';

/* The feature's own fallback strings, kept here rather than in the shared
   catalogue in modules/i18n.js. They are ten lines only this module reads, and
   a site with the newsletter switched off must not carry them: the module
   itself is tree-shaken out of the bundle, and anything parked in i18n.js would
   outlive it. Hugo's catalogue still wins key by key — js-bridge.html emits the
   nl_* strings for a site that has the feature on — so these are the last
   resort, in English, for the case where the bridge never ran.

   The purity annotation is what lets the whole table go with the module: an
   Object.assign call is a side effect as far as esbuild is concerned, and
   without it a build with the feature off would keep the strings it can never
   show. Same reason as CFG below. */
const T = /* @__PURE__ */ Object.assign({
  nlMsgEmpty: 'Enter an email address.',
  nlMsgTypo: 'That address looks like a typo — please check it.',
  nlMsgFail: "That didn't work — please try again.",
  nlMsgFailHint: 'Keeps happening? Write to me: {email}',
  nlMsgOk: "A confirmation letter is on its way to {email}. Follow the link in it and you're done.",
  nlMsgOkHint: 'No letter in the inbox — have a look in the spam folder.',
  nlAgain: 'use another address',
  nlSubscribed: "You're subscribed — I'll write when there's something new.",
  nlSubscribedPop: "You're subscribed.",
  nlSubOther: 'subscribe another address',
}, I18N);

const LS_DISMISS = 'nl.dismiss.';
/* A boolean, and deliberately only a boolean: the address never goes to
   localStorage. It is the reader's identity on a site that promises not to
   track them, it would survive a logout nobody offers, and nothing here needs
   it — the state we render says "you are subscribed", never who. The flag also
   means only "this browser completed a subscription once": it cannot know about
   an unsubscribe made from a letter, which is why every quiet line keeps a way
   back to a form rather than declaring the matter closed. */
const LS_SUBSCRIBED = 'nl.subscribed';
/* How long a Turnstile token is worth waiting for. Blockers cut the challenge
   script more often than average among readers of a privacy-minded blog, so the
   wait is short and its failure is not fatal: the request goes without a token
   and the worker decides (TURNSTILE_REQUIRED, default "pass"). */
const TS_TIMEOUT = 2000;

/* Behind a purity annotation so the module can be dropped whole. Without it
   esbuild keeps this one statement — a property read on `window` might hit a
   getter, so it counts as a side effect — and a build with the feature off
   would still ship the line that names TAIGA_NL. */
const CFG = /* @__PURE__ */ (function () {
  return (typeof window !== 'undefined' && window.TAIGA_NL) || {};
})();

/* localStorage throws in a few privacy configurations; nothing here is worth
   breaking the page over. */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }

function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/* Deliberately loose, and the same expression the worker uses: the only thing
   worth catching client-side is a typo the reader can see for themselves
   (missing @, missing dot, stray space). Real verification is the confirmation
   letter — this is double opt-in. */
function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* ---- 1. form state machine -------------------------------------------------
   idle → submitting → success | error. The unit is the smallest thing that
   changes state, so every lookup is scoped to it. */

function unitOf(el) { return el.closest('.nl-unit') || el.parentNode; }

function setMsg(unit, html, kind) {
  const msg = $('.nl-msg', unit);
  if (!msg) return;
  msg.className = 'nl-msg on' + (kind ? ' is-' + kind : '');
  msg.innerHTML = html;
}

function clearMsg(unit) {
  const msg = $('.nl-msg', unit);
  if (msg) { msg.className = 'nl-msg'; msg.innerHTML = ''; }
}

/* A second, quieter line under a status. It goes INSIDE .nl-msg, in the same
   write: the element is an aria-live region, and a line appended to it a moment
   later would reach a screen reader as a separate announcement. */
function hint(text) {
  return '<span class="nl-hint">' + text + '</span>';
}

/* The way out of the one dead end retrying cannot fix: an address the list has
   blocked (after a bounce, say) is refused on every attempt, so "try again" is
   advice that can only fail. Rendered where the site named an address to write
   to — see newsletter/cfg.html. */
function failHint() {
  const mail = CFG.contactEmail;
  if (!mail) return '';
  const safe = escapeHtml(mail);
  const link = '<a href="mailto:' + safe + '">' + safe + '</a>';
  return hint(String(T.nlMsgFailHint).replace('{email}', link));
}

/* The label is swapped for the spinner rather than joined by it, and the
   button's own width is pinned first: a control that changes size mid-request
   drags the field beside it, and the row twitches at exactly the moment the
   reader is waiting to see whether anything happened. */
function busy(form, on) {
  const btn = $('.nl-go', form);
  const field = $('.nl-field', form);
  if (btn) {
    if (on) btn.style.minWidth = btn.offsetWidth + 'px';
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    btn.classList.toggle('is-busy', on);
    if (!on) btn.style.minWidth = '';
  }
  if (field) field.disabled = on;
}

/* success hides the form rather than disabling it: a dead input the reader can
   still click reads as a bug, and the "use another address" link below the
   message covers the one case where the form is wanted back. */
function succeed(unit, email) {
  const form = $('.nl-form', unit);
  const note = $('.nl-note', unit);
  lsSet(LS_SUBSCRIBED, '1');
  if (form) form.hidden = true;
  if (note) note.hidden = true;
  /* the spam hint is unconditional, and honest: the backend sends a fresh
     confirmation letter on every attempt, so a reader who sees nothing in the
     inbox is being filtered, not ignored */
  setMsg(unit, String(T.nlMsgOk).replace('{email}', '<b>' + escapeHtml(email) + '</b>')
    + hint(T.nlMsgOkHint), 'ok');
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'nl-again';
  again.textContent = T.nlAgain;
  again.addEventListener('click', function () { reset(unit); });
  $('.nl-msg', unit).appendChild(again);
}

function reset(unit) {
  const form = $('.nl-form', unit);
  const note = $('.nl-note', unit);
  clearMsg(unit);
  if (form) {
    form.hidden = false;
    const field = $('.nl-field', form);
    if (field) { field.value = ''; field.removeAttribute('aria-invalid'); field.focus(); }
  }
  if (note) note.hidden = false;
}

/* ---- 1b. Turnstile ---------------------------------------------------------
   An invisible widget, rendered once on first use and executed per submit. The
   script itself is loaded only where it can be used (worker mode + a site key);
   everything below degrades to an empty token — a missing script, a blocked
   challenge, a slow one — because a reader who cannot pass a check they cannot
   see must still be able to subscribe. */
let tsWidget = null;
let tsPending = null;

function tsSettle(token) {
  if (!tsPending) return;
  const resolve = tsPending;
  tsPending = null;
  resolve(token || '');
}

function turnstileToken() {
  if (CFG.mode !== 'worker' || !CFG.turnstileSiteKey) return Promise.resolve('');
  const api = window.turnstile;
  if (!api) return Promise.resolve('');
  return new Promise(function (resolve) {
    tsSettle('');            /* an execute still in flight loses its claim */
    tsPending = resolve;
    setTimeout(function () { tsSettle(''); }, TS_TIMEOUT);
    try {
      if (tsWidget === null) {
        const host = document.createElement('div');
        host.className = 'nl-ts';
        host.style.display = 'none';
        document.body.appendChild(host);
        tsWidget = api.render(host, {
          sitekey: CFG.turnstileSiteKey,
          size: 'invisible',
          callback: tsSettle,
          'error-callback': function () { tsSettle(''); },
          'timeout-callback': function () { tsSettle(''); },
        });
      } else {
        api.reset(tsWidget);
      }
      api.execute(tsWidget);
    } catch (e) {
      tsSettle('');
    }
  });
}

/* ---- 1c. the request -------------------------------------------------------
   Resolves to 'ok' | 'invalid' | 'fail'. Nothing finer reaches the reader: 403,
   429, 502 and a dropped connection all mean the same thing to someone who just
   wants the letter — try again. */
function send(email, hp, token) {
  const url = CFG.endpoint;
  if (!url) return Promise.resolve('fail');
  const direct = CFG.mode === 'direct';
  const body = direct
    ? { email: email, name: '', list_uuids: [CFG.listUUID] }
    : { email: email, list: 'main', website: hp, ts_token: token };
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(function (res) {
    if (res.ok) return 'ok';                    /* 202 in worker mode, any 2xx direct */
    if (res.status === 400) return 'invalid';
    return 'fail';
  }).catch(function () { return 'fail'; });
}

function submit(form) {
  const unit = unitOf(form);
  const field = $('.nl-field', form);
  const hpField = $('.nl-hp input', form) || $('input[name="website"]', form);
  const hp = hpField ? hpField.value : '';
  const email = (field ? field.value : '').trim();

  if (!email) {
    field.setAttribute('aria-invalid', 'true');
    setMsg(unit, T.nlMsgEmpty, 'warn');
    field.focus();
    return;
  }
  if (!validEmail(email)) {
    field.setAttribute('aria-invalid', 'true');
    setMsg(unit, T.nlMsgTypo, 'warn');
    field.focus();
    return;
  }

  /* honeypot in direct mode: there is no worker to swallow the request, so the
     page plays the same trick itself — a success the bot cannot learn from. */
  if (hp && CFG.mode === 'direct') { succeed(unit, email); return; }

  field.removeAttribute('aria-invalid');
  clearMsg(unit);
  busy(form, true);

  turnstileToken().then(function (token) {
    return send(email, hp, token);
  }).then(function (outcome) {
    busy(form, false);
    if (outcome === 'ok') { succeed(unit, email); return; }
    if (outcome === 'invalid') {
      field.setAttribute('aria-invalid', 'true');
      setMsg(unit, T.nlMsgTypo, 'warn');
      field.focus();
      return;
    }
    setMsg(unit, T.nlMsgFail + failHint(), 'err');
  });
}

/* ---- 2. header popover -----------------------------------------------------
   Same open/close contract as the palette popover: the button owns
   aria-expanded, Escape returns focus to it, a click anywhere outside closes.
   No focus trap — the panel holds two controls and one link. Written against
   the pair (.nl-wrap → .nl-btn + .nl-pop) rather than against ids, so the code
   never has to know how many of them a page carries. */

function popOf(btn) {
  const wrap = btn.closest('.nl-wrap');
  return wrap ? $('.nl-pop', wrap) : null;
}

function popOpen(btn, open) {
  const pop = popOf(btn);
  if (!pop) return;
  pop.hidden = !open;
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const field = $('.nl-field', pop);
    if (field && !field.hidden) field.focus();
  }
}

function popCloseAll(except) {
  $$('.nl-wrap .nl-btn[aria-expanded="true"]').forEach(function (b) {
    if (b !== except) popOpen(b, false);
  });
}

/* ---- 3. collapsible in-article block ---------------------------------------
   The flag is keyed per block, not per page: the same block can appear in every
   part of a series and should stay folded once folded.

   Collapsing does NOT remove the block. It swaps it for one quiet line that
   says the form is folded and offers it back — the earlier version deleted the
   block outright, which made the close button a one-way door with no undo
   anywhere in the UI. Both directions persist, so a reader who unfolds the
   block finds it unfolded on the next page too.

   The storage value is unchanged on purpose: '1' has always meant "the reader
   put this away", and it now means "collapsed", so anyone who dismissed a block
   under the old code opens the page to a ghost line instead of nothing. That is
   the intended migration — the block comes back within reach rather than
   silently reappearing in full. '0' is the new value, written only when the
   reader unfolds it, and it is what keeps an unfolded block unfolded. */
function collapse(el, ghost, on) {
  el.classList.toggle('is-collapsed', on);
  if (ghost) ghost.hidden = !on;
  const x = $('.nl-x', el);
  if (x) x.hidden = on;
}

function initDismiss() {
  $$('[data-nl-dismiss]').forEach(function (el) {
    const key = LS_DISMISS + el.getAttribute('data-nl-dismiss');
    const ghost = $('.nl-ghost', el);
    const x = $('.nl-x', el);
    collapse(el, ghost, lsGet(key) === '1');
    if (x) {
      x.addEventListener('click', function () {
        collapse(el, ghost, true);
        lsSet(key, '1');
        /* focus would otherwise fall to the body: the control that had it just
           went away. The line that replaced it is where the reader is looking. */
        const back = ghost && $('.nl-ghost-a', ghost);
        if (back) back.focus();
      });
    }
    const back = ghost && $('.nl-ghost-a', ghost);
    if (back) {
      back.addEventListener('click', function () {
        collapse(el, ghost, false);
        lsSet(key, '0');
        /* the block, not the field: the reader asked to see the offer again,
           they did not ask to start typing an address. */
        el.focus();
      });
    }
  });
}

/* ---- 4. subscribe-page anchor ----------------------------------------------
   Arriving from the popover's footer link with #form puts the cursor in the
   page's own field, so the reader does not retype what they started. */
/* ---- 3b. the subscribed state ----------------------------------------------
   A reader who has already subscribed does not need the pitch again — the same
   form under every article reads as a site that is not listening. Once this
   browser has completed a subscription, every placement folds down to one quiet
   line, and the block that would otherwise collapse into a ghost shows this
   line instead: "subscribed" outranks "collapsed", because it explains why the
   form is gone, and the ghost's offer to bring it back would be noise.

   Two things stay exactly as they were. The header bell is untouched: it is
   navigation, and a control that appears and disappears with state is worse
   than one that is always in the same place. The subscribe page is untouched
   too — it is the canonical way in, someone may arrive at it to add a second
   address, and a page whose entire subject is the form must always show one.

   Every line keeps a route back to a form, because the flag can be wrong: it
   only records that a subscription happened in THIS browser, and it cannot hear
   about an unsubscribe made from a letter. The popover carries that route
   itself, since it is the one placement a reader can open from anywhere. */
function onSubscribePage() {
  const p = CFG.subscribePage;
  if (!p) return false;
  const norm = function (s) { return String(s).replace(/\/+$/, ''); };
  return norm(location.pathname) === norm(p);
}

function subscribedLine(unit, inPop) {
  const form = $('.nl-form', unit);
  const note = $('.nl-note', unit);
  if (form) form.hidden = true;
  if (note) note.hidden = true;
  const line = document.createElement('p');
  line.className = 'nl-sub';
  line.textContent = inPop ? T.nlSubscribedPop : T.nlSubscribed;
  if (inPop) {
    /* the popover is the one placement that travels with the reader, so it is
       where a second address is worth offering. The rest stay one plain line. */
    const other = document.createElement('button');
    other.type = 'button';
    other.className = 'nl-again';
    other.textContent = T.nlSubOther;
    other.addEventListener('click', function () {
      if (form) form.hidden = false;
      if (note) note.hidden = false;
      const field = form && $('.nl-field', form);
      if (field) { field.value = ''; field.focus(); }
      line.remove();
    });
    line.appendChild(other);
  }
  const msg = $('.nl-msg', unit);
  if (msg) unit.insertBefore(line, msg); else unit.appendChild(line);
}

function initSubscribed() {
  if (lsGet(LS_SUBSCRIBED) !== '1' || onSubscribePage()) return;
  $$('.nl-unit').forEach(function (unit) {
    subscribedLine(unit, !!unit.closest('.nl-pop'));
    /* a block that also carries a collapse flag must not do both: unfold it and
       drop the ghost, so the quiet line is the only thing the reader meets */
    const block = unit.closest('[data-nl-dismiss]');
    if (!block) return;
    block.classList.remove('is-collapsed');
    const ghost = $('.nl-ghost', block);
    if (ghost) ghost.hidden = true;
    const x = $('.nl-x', block);
    if (x) x.hidden = true;
  });
}

function initAutofocus() {
  if (location.hash !== '#form') return;
  const field = $('#form .nl-field') || $('.nl-prose .nl-field');
  if (field) field.focus();
}

export function bindNewsletter() {
  if (!$('.nl-form') && !$('[data-nl-dismiss]')) return;

  document.addEventListener('submit', function (e) {
    const form = e.target.closest ? e.target.closest('.nl-form') : null;
    if (!form) return;
    e.preventDefault();
    submit(form);
  });

  /* typing again clears a stale validation hint, but never a result message */
  document.addEventListener('input', function (e) {
    const field = e.target.closest ? e.target.closest('.nl-field') : null;
    if (!field || field.getAttribute('aria-invalid') !== 'true') return;
    field.removeAttribute('aria-invalid');
    const unit = unitOf(field);
    const msg = $('.nl-msg', unit);
    if (msg && msg.classList.contains('is-warn')) clearMsg(unit);
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest ? e.target.closest('.nl-btn') : null;
    if (btn) {
      const pop = popOf(btn);
      const wantOpen = pop ? pop.hidden : false;
      popCloseAll(btn);
      popOpen(btn, wantOpen);
      return;
    }
    /* a click inside a panel is the reader working with the form */
    if (e.target.closest && e.target.closest('.nl-pop')) return;
    popCloseAll(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const open = $('.nl-wrap .nl-btn[aria-expanded="true"]');
    if (!open) return;
    popOpen(open, false);
    open.focus();
  });

  /* order matters: initDismiss restores the collapsed state from storage, and
     initSubscribed overrides it where both apply */
  initDismiss();
  initSubscribed();
  initAutofocus();
}
