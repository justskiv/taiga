/* comments — the Comentario block at the foot of an article.
   Markup: layouts/_partials/comments/block.html · Styles: 29-comments.css

   The engine's bundle is NOT on the page. Nothing of it loads — no script, no
   stylesheet, no WebSocket — until the reader asks for comments. What the block
   ships until then is a button and, once it scrolls into view, one small POST
   that fills in the number on it.

   Self-guards on .cmnt, so it stays quiet on every page without the block. */

import { plural } from './i18n.js';

const ORIGIN = (window.TAIGA_CMNT || {}).origin || '';

export function bindComments() {
  const root = document.documentElement;
  const box = document.querySelector('.cmnt');
  if (!box || !ORIGIN) return;

  const btn = box.querySelector('.cmnt-open');
  const lbl = box.querySelector('.cmnt-lbl');
  const nSlot = box.querySelector('.cmnt-n');
  const status = box.querySelector('.cmnt-status');
  const body = box.querySelector('.cmnt-body');
  const widget = box.querySelector('comentario-comments');
  if (!btn || !widget) return;

  const t = (window.THEME_I18N || {});

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

  /* ---- the count --------------------------------------------------------
     Fired when the block comes into view, not on load: a reader who leaves
     from the first screen costs the instance nothing. The request is shaped
     for batches (paths[], up to 32 per call) even though it asks about one
     page — a count in the feed would reuse it unchanged.

     A path with no page behind it yet is ABSENT from the answer rather than
     zero, so read it with `in`, not with a falsy check. */
  function fetchCount() {
    const path = widget.getAttribute('page-id') || location.pathname;
    fetch(ORIGIN + '/api/embed/comments/counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: location.host, paths: [path] }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        const m = d && d.commentCounts;
        const n = m && (path in m) ? m[path] : 0;
        if (n > 0) nSlot.textContent = String(n);
      })
      .catch(function () { /* a missing count is not worth telling anyone about */ });
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();
        fetchCount();
      }
    }, { rootMargin: '400px' });
    io.observe(btn);
  } else {
    fetchCount();
  }

  /* ---- the sort switch ---------------------------------------------------
     The engine offers four orders through three buttons: "Оценка" is a radio
     that turns into a toggle once chosen, and the only sign of its second
     state is an 8px caret flipping over. Nobody discovers that, and nobody
     wants the state it leads to — "worst first" exists because the author
     saved a button, not because a reader asked.

     The behaviour stays as it is; what changes is that the state says its own
     name. The score button reports which of its two orders is in force, so the
     toggle announces itself by changing a word. The other two are renamed to
     match: "Оценка · Старые · Новые" mixes a criterion with two values, while
     "Лучшие · Старые · Новые" is three values of one thing.

     textContent, not a ::before with content: this rewrites the accessible
     name along with the visible label, so voice control hears what is written.
     A CSS text swap would leave the two disagreeing — WCAG 2.5.3.

     Falls back to the engine's own wording when the theme has no strings for
     this language: it ships fourteen translations, the theme has two. */
  function dressSortBar() {
    const bar = widget.querySelector('.comentario-sort-buttons');
    if (!bar || bar.dataset.cmntDressed) return;

    if (!t.cmntSortBest) return;

    const btns = Array.prototype.slice.call(bar.querySelectorAll('.comentario-btn'));
    /* The score button is the only one the engine gives an icon, and it is
       absent entirely on a domain with voting off — so the two time buttons
       are found by elimination, never by position. */
    const score = btns.filter(function (b) { return !!b.querySelector('.comentario-icon'); })[0];
    const rest = btns.filter(function (b) { return b !== score; });
    if (rest[0]) rest[0].textContent = t.cmntSortOldest;
    if (rest[1]) rest[1].textContent = t.cmntSortNewest;

    if (score) {
      const paint = function () {
        const asc = score.classList.contains('comentario-sort-asc');
        score.textContent = asc ? t.cmntSortWorst : t.cmntSortBest;
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
     the engine keeps the draft through the OAuth round trip, and publishes the
     comment with the same call that finishes the login (`submitNewComment`
     retries `commentNew` itself once a principal exists). So the label is not
     a promise we invented: after signing in the comment really does go.

     What was wrong is WHEN the cost was stated. It has to be stated at the
     moment the editor opens, before a single character is typed — and it has
     to be stated in every editor, including the one that opens under a comment
     three screens down, where the profile bar was never present.

     Two more texts change here:
       · the closed field said "Добавить комментарий" — the SAME string the
         submit button uses, so a field and the button under it carried one
         label twice. A field is named by what you do in it;
       · the hint under the editor names who the door leads through, which the
         button's own label has no room for.

     textContent, not a ::before — the accessible name has to change with the
     visible one, or voice control ends up saying something else (WCAG 2.5.3). */
  function signedOut() {
    return !!widget.querySelector('.comentario-profile-bar > .comentario-btn-primary');
  }

  function dressEditor(ed) {
    if (!ed || ed.dataset.cmntDressed || !t.cmntSubmitIn) return;
    const submit = ed.querySelector('button[type="submit"]');
    if (!submit) return;
    const out = signedOut();
    submit.textContent = out ? t.cmntSubmitIn : t.cmntSubmit;
    /* No hint line beside it, and no tooltip on it. The label already says
       what the press costs; naming the providers here would repeat what the
       dialog shows a moment later, and a tooltip on the one button the reader
       is aiming at is a card thrown over their target. */
    ed.dataset.cmntDressed = '1';
  }

  function dressPlaceholder() {
    const ph = widget.querySelector('.comentario-add-comment-placeholder');
    if (ph && t.cmntWrite && ph.textContent !== t.cmntWrite) ph.textContent = t.cmntWrite;
  }

  /* ---- the count line -----------------------------------------------------
     The engine carries ONE form of the word per language — Russian gets
     «комментариев», so it writes «1 комментариев» and «4 комментариев», and
     English is no better past one. Hugo owns the CLDR catalogue and rendered
     one word per probe count into cmntForms; i18n.js asks Intl.PluralRules
     which probe shares a category with the real number. Same machinery the
     tags filter uses.

     Rewritten on a watcher rather than once: the engine's setter clears and
     refills this node on every sort change and every live update, so anything
     we put there is gone by the next one. The guard is the comparison — we
     only write when the text differs, otherwise our own write would wake the
     observer again. */
  function dressCount() {
    const el = widget.querySelector('.comentario-comment-count');
    if (!el || !t.cmntForms) return;
    const n = parseInt(el.textContent, 10);
    if (isNaN(n)) return;                    /* not the "N word" shape — leave it */
    const want = n + ' ' + plural(n, t.cmntForms);
    if (el.textContent.trim() !== want) el.textContent = want;
  }

  /* The engine focuses the dialog's CLOSE button when it opens — which is both
     the source of the browser's blue ring (now replaced by the theme's) and
     the wrong target: the reader opened this to sign in, not to leave. Move
     the first focus to the first provider button when there is one.

     The dialog is appended straight into .comentario-root, so childList
     without subtree catches it. */
  function watchDialog() {
    const rootEl = widget.querySelector('.comentario-root');
    if (!rootEl) return;
    new MutationObserver(function () {
      const b = widget.querySelector('.comentario-dialog .comentario-oauth-buttons .comentario-btn');
      if (b && !b.dataset.cmntFocused) { b.dataset.cmntFocused = '1'; b.focus(); }
    }).observe(rootEl, { childList: true });
  }

  /* Changing the sort does NOT rebuild the toolbar — it re-renders the list and
     the count text, one level below. The toolbar is rebuilt only by the
     engine's reload(): init, sign-in, sign-out, locking a page. That is exactly
     a childList change on .comentario-main-area, so no subtree here. */
  function watchToolbar() {
    dressSortBar();
    dressCount();
    dressPlaceholder();
    const area = widget.querySelector('.comentario-main-area');
    if (area) {
      new MutationObserver(function () {
        dressSortBar(); dressCount(); dressPlaceholder();
      }).observe(area, { childList: true });
      /* An editor can be inserted anywhere in the thread — under any comment's
         Reply — so this one needs subtree, unlike the toolbar watcher above. */
      new MutationObserver(function () {
        const eds = area.querySelectorAll('.comentario-comment-editor');
        for (let i = 0; i < eds.length; i++) dressEditor(eds[i]);
      }).observe(area, { childList: true, subtree: true });
    }
    const count = widget.querySelector('.comentario-comment-count');
    if (count) new MutationObserver(dressCount).observe(count, { childList: true, characterData: true, subtree: true });
    watchDialog();
  }

  /* ---- loading ----------------------------------------------------------
     One promise for the page: a second click must not inject a second script.
     The bundle is loaded straight from the instance — never proxied, never
     vendored, never cache-busted. The file is served with its own origin baked
     into it, so a copy goes stale silently and a `?v=` only defeats the cache
     the instance manages itself. */
  let loading = null;
  let loaded = false;
  function loadEngine() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = ORIGIN + '/comentario.js';
      s.defer = true;
      s.onload = function () { loaded = true; resolve(); };
      s.onerror = function () { loading = null; reject(new Error('comentario.js')); };
      document.body.appendChild(s);
    });
    return loading;
  }

  /* The widget announces nothing when it is done — no event, no global, not a
     promise. The one observable thing is its main area filling up. */
  function whenRendered(timeout) {
    return new Promise(function (resolve, reject) {
      function done() {
        const area = widget.querySelector('.comentario-main-area');
        return !!area && area.children.length > 0;
      }
      if (done()) return resolve();
      const mo = new MutationObserver(function () {
        if (done()) { mo.disconnect(); clearTimeout(timer); resolve(); }
      });
      mo.observe(widget, { childList: true, subtree: true });
      const timer = setTimeout(function () {
        mo.disconnect();
        reject(new Error('render'));
      }, timeout || 15000);
    });
  }

  function setStatus(text, tone) {
    status.textContent = text || '';
    if (tone) status.setAttribute('data-tone', tone);
    else status.removeAttribute('data-tone');
  }

  function fail() {
    body.hidden = true;
    btn.disabled = false;
    btn.setAttribute('aria-expanded', 'false');
    setStatus(t.cmntError || 'Comments failed to load.', 'error');
    const retry = document.createElement('button');
    retry.className = 'cmnt-retry';
    retry.type = 'button';
    retry.textContent = t.cmntRetry || 'Try again';
    retry.addEventListener('click', function () { setStatus(''); open(); });
    status.appendChild(retry);
  }

  /* Opened by a click, so it closes by one too: a reader who looked at the
     discussion and wants the article back should not have to reload the page.
     The engine stays loaded and its socket stays open — reopening is instant,
     and tearing the widget down would throw away a half-written comment. */
  function setOpen(on) {
    /* the button was disabled while the engine loaded; it is a toggle now and
       has to come back to life, or the first press would also be the last */
    btn.disabled = false;
    body.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    lbl.textContent = on ? (t.cmntClose || 'Hide comments') : (t.cmntOpen || 'Show comments');
    box.classList.toggle('is-open', on);
  }

  function open() {
    if (loaded) { setOpen(body.hidden); return; }   /* already here — just toggle */
    btn.disabled = true;
    setStatus(t.cmntLoading || 'Loading comments…');
    loadEngine()
      .then(function () {
        body.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        return whenRendered();
      })
      .then(function () {
        setStatus('');
        watchToolbar();
        setOpen(true);
      })
      .catch(fail);
  }

  btn.addEventListener('click', open);

  /* Arriving from a notification mail: #comentario-<uuid> points at one
     comment, #comentario at the block. Open without waiting for a click — the
     engine scrolls to the comment and highlights it once it initialises, so we
     add no scrolling of our own. It never listens for hashchange, which is why
     this runs once, here. */
  if (location.hash.indexOf('#comentario') === 0) open();
}
