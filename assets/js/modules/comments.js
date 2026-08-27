/* comments — the Comentario thread at the foot of an article.
   Markup: layouts/_partials/comments/block.html · Styles: 29-comments.css

   The thread is open: comments are part of the guide, and hiding them behind a
   press buys nothing. What IS withheld is the engine's bundle — 95 KB of
   JavaScript and 51 KB of CSS, with fonts of its own. It arrives only once the
   reader gets within 900 px of the block, so a guide that is read and left
   costs the reader nothing and the instance NOTHING AT ALL: not a script, not
   a stylesheet, not a socket, not one request.

   An earlier draft also asked the instance for the comment count on the way
   in, to fill the header before the bundle landed. That was worth a request
   when the thread was behind a button and the number was the whole invitation.
   It is not worth one now: the bundle arrives before the block does, and
   brings a count of its own.

   The engine announces nothing when it renders — no event, no global, no
   promise — so a MutationObserver is the only hook there is. It is detached
   while we work, or our own writes would feed it back into itself.

   Self-guards on #comments, so it stays quiet on every page without a thread.

   The design work lives in the stylesheet. This file does only what CSS
   cannot: the plural forms, the lazy load, a handful of labels, and putting
   back what the engine's own collapse leaves broken. */

import { plural } from './i18n.js';

const ORIGIN = (window.TAIGA_CMNT || {}).origin || '';

/* How close the reader has to get before the bundle is fetched. A plain
   distance check rather than IntersectionObserver: an observer in a tab that
   has never been painted can stay silent until the tab is focused, and a
   thread that only exists in a focused tab is a trap — the reader who opened
   five guides in background tabs finds four of them without comments. */
const REACH = 900;

export function bindComments() {
  const root = document.documentElement;
  const box = document.getElementById('comments');
  if (!box || !ORIGIN) return;

  const widget = box.querySelector('comentario-comments');
  const headN = box.querySelector('.cmnt-n');
  const status = box.querySelector('.cmnt-status');
  if (!widget) return;

  const t = window.THEME_I18N || {};

  /* ---- palette ----------------------------------------------------------
     The initial sync is not a nicety. prefs.js restores the reader's saved
     palette and rewrites data-scheme in <head>, BEFORE this deferred bundle
     runs — so the `theme` the server printed on the tag is already stale, and
     a MutationObserver cannot see a mutation that happened before it existed.
     Read the live value first, then subscribe.

     `theme` is the only attribute ever touched: it is handled purely in CSS
     and repaints in place, whereas `lang` or `css-override` reinitialise the
     widget and discard a comment the reader is halfway through writing. */
  function syncTheme() {
    widget.setAttribute('theme', root.getAttribute('data-scheme') === 'light' ? 'light' : 'dark');
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(root, {
    attributes: true, attributeFilter: ['data-scheme'],
  });

  /* ---- label rewrites ---------------------------------------------------- */

  function setText(el, s) {
    if (el && s && el.textContent !== s) el.textContent = s;
  }

  /* Appends a word to a button the engine drew as a bare glyph. The icon is
     hidden in CSS; the word carries the accessible name with it, so voice
     control says what is written — a ::before with `content` would leave the
     two disagreeing (WCAG 2.5.3). */
  function addLabel(btn, text, cls) {
    if (!btn || !text || btn.querySelector('.' + cls)) return;
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    btn.appendChild(s);
  }

  /* ---- the sort rail ------------------------------------------------------
     The engine offers four orders through three buttons: the score button is a
     radio that turns into a toggle once chosen, and the only sign of its second
     state is an 8px caret flipping over. Nobody discovers that.

     The behaviour stays; what changes is that the state says its own name. The
     score button reports which of its two orders is in force, so the toggle
     announces itself by changing a word. The other two are renamed to match:
     «Оценка · Старые · Новые» mixes a criterion with two values, where three
     values of one thing are wanted.

     Falls back to the engine's own wording when the theme has no strings for
     this language: it ships fourteen translations, the theme has two. */
  function dressSortBar() {
    const bar = widget.querySelector('.comentario-sort-buttons');
    if (!bar || bar.dataset.cmntDressed || !t.cmntSortBest) return;

    const btns = Array.prototype.slice.call(bar.querySelectorAll('.comentario-btn'));
    /* The score button is the only one the engine gives an icon, and it is
       absent entirely on a domain with voting off — so the two time buttons
       are found by elimination, never by position. */
    const score = btns.filter(function (b) { return !!b.querySelector('.comentario-icon'); })[0];
    const rest = btns.filter(function (b) { return b !== score; });
    if (rest[0]) setText(rest[0], t.cmntSortOldest);
    if (rest[1]) setText(rest[1], t.cmntSortNewest);

    if (score) {
      const paint = function () {
        setText(score, score.classList.contains('comentario-sort-asc')
          ? t.cmntSortWorst : t.cmntSortBest);
      };
      paint();
      new MutationObserver(paint).observe(score, {
        attributes: true, attributeFilter: ['class'],
      });
    }
    bar.dataset.cmntDressed = '1';
  }

  /* ---- the editor: say the price before the first keystroke ---------------
     Signing in is not a surprise sprung on someone who has already written —
     the engine keeps the draft through the OAuth round trip and publishes the
     comment with the same call that finishes the login (`submitNewComment`
     retries `commentNew` itself once a principal exists). So the label is not
     a promise we invented: after signing in, the comment really does go.

     What matters is WHEN the cost is stated: at the moment the editor opens,
     before a character is typed, and in every editor — including the one that
     opens under a comment three screens down, where the profile bar never
     was. */
  function signedOut() {
    return !!widget.querySelector('.comentario-profile-bar > .comentario-btn-primary');
  }

  function dressEditor(ed) {
    if (!ed || !t.cmntSubmitIn) return;
    const submit = ed.querySelector('button[type="submit"]');
    setText(submit, signedOut() ? t.cmntSubmitIn : t.cmntSubmit);
  }

  /* ---- collapsed replies --------------------------------------------------
     Collapsing is an engine feature that leaves the replies in place at zero
     opacity: they keep their height and leave half a screen of hole. The
     stylesheet folds them for real; this puts the way back where the hole was,
     and says how much is behind it. */
  function foldedNotes(r) {
    r.querySelectorAll('.comentario-card > .comentario-card-expand-body').forEach(function (body) {
      const tog = body.previousElementSibling;
      const off = tog && tog.classList.contains('comentario-collapsed');
      let note = body.querySelector(':scope > .cmnt-folded');

      if (!off) { if (note) note.remove(); return; }
      if (!note) {
        note = document.createElement('button');
        note.type = 'button';
        note.className = 'cmnt-folded';
        note.addEventListener('click', function () { tog.click(); });
        body.appendChild(note);
      }
      const n = body.querySelectorAll('.comentario-card-children .comentario-card').length;
      setText(note, n + ' ' + plural(n, t.cmntReplyForms || {}) + ' — ' + (t.cmntShow || ''));
    });
  }

  /* ---- the login dialog ---------------------------------------------------
     Two changes only. The engine titles it «Войти» and heads the provider list
     with «Вход через», which says nothing the two buttons below do not — while
     the reader, who landed here by pressing reply or a vote arrow, has not been
     told why a dialog appeared at all. That sentence takes its place.

     The engine also focuses the CLOSE button when the dialog opens, which is
     the wrong target: the reader opened this to sign in, not to leave. */
  function dressDialog(dlg) {
    if (!dlg) return;
    setText(dlg.querySelector('.comentario-dialog-title'), t.cmntLoginTitle);

    /* The engine builds the provider block as
           div.dialog-centered( "Вход через", div.oauth-buttons( … ) )
       so the sentence to replace is the one CARRYING the buttons — found by
       the buttons, not by position or by matching the engine's own wording in
       one of its fourteen languages.

       A dialog can hold more than one .dialog-centered: an instance with local
       password login also renders a sign-up block with a line of its own, and
       rewriting every one of them printed our sentence on the page twice.
       Production has no such block — no idps, no local login, nothing but the
       two buttons — but a development instance does, which is exactly where a
       bug like this is supposed to be caught. */
    const providers = dlg.querySelector('.comentario-oauth-buttons');
    const lead = providers && providers.closest('.comentario-dialog-centered');
    const n = lead && lead.firstChild;
    if (n && n.nodeType === 3 && t.cmntLoginWhy) n.nodeValue = t.cmntLoginWhy;
    const first = dlg.querySelector('.comentario-oauth-buttons .comentario-btn');
    if (first && !first.dataset.cmntFocused) {
      first.dataset.cmntFocused = '1';
      first.focus();
    }
  }

  /* ---- one pass over whatever the engine has just rendered ---------------- */

  function decorate() {
    const r = widget.querySelector('.comentario-root');
    if (!r) return;

    setText(r.querySelector('.comentario-add-comment-placeholder'), t.cmntWrite);
    r.querySelectorAll('.comentario-comment-editor').forEach(dressEditor);

    dressSortBar();

    /* Reply is button 3 of the first section (up, down, reply) — an order the
       engine fixes in code. The two votes keep their arrows; only this one
       gets a word, because it is the one action the thread is for. */
    r.querySelectorAll('.comentario-card-self > .comentario-toolbar > .comentario-toolbar-section:first-child')
     .forEach(function (sec) {
       addLabel(sec.querySelectorAll(':scope > .comentario-btn')[2], t.cmntReply, 'cmnt-txt');
     });

    /* The badge means "this account owns the domain". On a one-author blog
       that is the author, and «Модератор» promises a role nobody here plays. */
    r.querySelectorAll('.comentario-badge-moderator').forEach(function (b) {
      setText(b, t.cmntAuthor);
    });

    /* a zero score should not read as loudly as a real one */
    r.querySelectorAll('.comentario-score').forEach(function (s) {
      s.classList.toggle('cmnt-zero', s.textContent.trim() === '0');
    });

    /* Moderation states. Matched on the engine's own Russian because there is
       no class to match on; if it rewords them the notice simply stays the
       engine's, which is not a failure. */
    r.querySelectorAll('.comentario-moderation-notice').forEach(function (n) {
      if (n.textContent.indexOf('ожидает утверждения') >= 0) setText(n, t.cmntPending);
      else if (n.textContent.indexOf('отклонён') >= 0) setText(n, t.cmntRejected);
    });

    /* the signed-in bar: gear and exit are bare icons, give them their words */
    r.querySelectorAll('.comentario-profile-bar .comentario-btn-tool').forEach(function (b) {
      addLabel(b, b.getAttribute('title'), 'cmnt-lbl');
    });

    foldedNotes(r);
    dressDialog(r.querySelector('.comentario-dialog'));

    /* The engine carries ONE form of the word per language — Russian gets
       «комментариев», so it writes «1 комментариев». Hugo owns the CLDR
       catalogue and rendered one word per probe count into cmntForms;
       i18n.js asks Intl.PluralRules which probe shares a category with the
       real number. Same machinery the tags filter uses.

       Read from the engine's own counter, which is hidden in CSS: it is the
       only number that knows about a comment posted a moment ago. The header
       stays blank until the toolbar exists — an empty thread and an unloaded
       one look the same from here, and «пока пусто» is a claim, not a
       placeholder. */
    if (headN && r.querySelector('.comentario-thread-toolbar')) {
      const c = r.querySelector('.comentario-comment-count');
      let n = 0;
      if (c && !c.classList.contains('comentario-hidden')) {
        const m = c.textContent.match(/\d+/);
        n = m ? Number(m[0]) : 0;
      }
      const html = n > 0
        ? '<b>' + n + '</b> ' + plural(n, t.cmntForms || {})
        : (t.cmntNone || '');
      if (headN.innerHTML !== html) headN.innerHTML = html;
    }
  }

  /* The observer is detached for the duration of our own writes: every one of
     them is a mutation inside the tree it watches, and it would wake itself in
     a loop. One frame of coalescing, because the engine rebuilds in bursts. */
  const mo = new MutationObserver(schedule);
  let queued = false;

  function watch() {
    mo.observe(widget, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['class', 'title'],
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      mo.disconnect();
      try { decorate(); } finally { watch(); }
    });
  }

  /* ---- loading ------------------------------------------------------------
     The bundle is loaded straight from the instance — never proxied, never
     vendored, never cache-busted. The file is served with its own origin baked
     into it, so a copy goes stale silently and a `?v=` only defeats the cache
     the instance manages itself. */
  let started = false;

  function fail() {
    if (!status) return;
    status.textContent = t.cmntError || 'Comments failed to load.';
    status.setAttribute('data-tone', 'error');
    const retry = document.createElement('button');
    retry.className = 'cmnt-retry';
    retry.type = 'button';
    retry.textContent = t.cmntRetry || 'Try again';
    retry.addEventListener('click', function () {
      status.textContent = '';
      status.removeAttribute('data-tone');
      started = false;
      load();
    });
    status.appendChild(retry);
  }

  function load() {
    if (started) return;
    started = true;
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', load);

    watch();
    const s = document.createElement('script');
    s.src = ORIGIN + '/comentario.js';
    s.defer = true;
    s.onerror = fail;
    document.body.appendChild(s);
  }

  function near() {
    return box.getBoundingClientRect().top <= innerHeight + REACH;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (near()) load();
    });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', load, { passive: true });

  /* Arriving from a notification mail: #comentario-<uuid> points at one
     comment, #comentario at the block. Load at once rather than waiting for a
     scroll that has already happened — the engine scrolls to the comment and
     highlights it once it initialises, so we add no scrolling of our own. It
     never listens for hashchange, which is why this runs here, once. */
  if (location.hash.indexOf('#comentario') === 0) load();

  if (near()) load();
}
