/* /tags/ filtering: the cloud and feed are server-rendered; this only reacts to
   location.hash. Selecting a tag reveals the feed and hides posts whose data-tags
   don't contain it; a repeat click (or "сбросить") clears. Reads its posts and
   chips from the DOM, so it stays in sync with whatever the template rendered.
   Inert off the tags page (guards on #cloud/#tagFeed). Strings via I18N. */
import { I18N } from './i18n.js';

function plural(n, forms) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}
function decode(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

export function initTagsFilter() {
  const cloud = document.getElementById('cloud');
  const tagSec = document.getElementById('tagSec');
  const tagHead = document.getElementById('tagHead');
  const tagFeed = document.getElementById('tagFeed');
  const tagEmpty = document.getElementById('tagEmpty');
  const cloudHint = document.getElementById('cloudHint');
  if (!cloud || !tagSec || !tagHead || !tagFeed) return;

  const BASE_TITLE = document.title;
  const chips = Array.prototype.slice.call(cloud.querySelectorAll('.tchip'));
  const posts = Array.prototype.slice.call(tagFeed.querySelectorAll('.post'));

  function curTag() {
    const h = location.hash.replace(/^#/, '');
    return h ? decode(h) : '';
  }

  function render() {
    const t = curTag();
    chips.forEach(function (c) {
      const on = c.getAttribute('data-tag') === t;
      c.classList.toggle('on', on);
      if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    if (!t) {
      tagSec.hidden = true; if (cloudHint) cloudHint.hidden = false;
      document.title = BASE_TITLE; return;
    }
    if (cloudHint) cloudHint.hidden = true;
    tagSec.hidden = false;
    let n = 0;
    posts.forEach(function (p) {
      const tags = (p.getAttribute('data-tags') || '').split(' ');
      const match = tags.indexOf(t) >= 0;
      p.hidden = !match;
      if (match) n++;
      Array.prototype.forEach.call(p.querySelectorAll('.p-tags a'), function (a) {
        a.classList.toggle('cur', decode((a.getAttribute('href') || '').split('#')[1] || '') === t);
      });
    });
    tagHead.textContent = '';
    if (n) {
      tagHead.append(I18N.tagFeedHead + ' · #' + t + ' · ' + n + ' ' + plural(n, I18N.guideForms));
      const reset = document.createElement('a');
      reset.className = 't-reset'; reset.href = location.pathname; reset.textContent = I18N.tagReset;
      tagHead.appendChild(reset);
      tagFeed.hidden = false; if (tagEmpty) tagEmpty.hidden = true;
      document.title = '#' + t + ' · ' + BASE_TITLE;
    } else {
      tagHead.append(I18N.tagFeedHead + ' · #' + t);
      tagFeed.hidden = true;
      if (tagEmpty) {
        tagEmpty.hidden = false; tagEmpty.textContent = '';
        const b = document.createElement('b'); b.textContent = '#' + t;
        tagEmpty.appendChild(b); tagEmpty.append(I18N.tagEmptyTail);
      }
      document.title = BASE_TITLE;
    }
  }

  function setTag(t) {
    history.replaceState(null, '', t ? '#' + encodeURIComponent(t) : location.pathname + location.search);
    render();
  }

  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target.closest && e.target.closest('a'); if (!a) return;
    if (a.classList.contains('t-reset')) { e.preventDefault(); setTag(''); return; }
    let t = null;
    if (a.classList.contains('tchip')) t = a.getAttribute('data-tag');
    else if (a.closest('.p-tags')) t = decode((a.getAttribute('href') || '').split('#')[1] || '');
    if (t === null) return;
    e.preventDefault();
    setTag(t === curTag() ? '' : t); /* repeat click on the active tag = reset */
  });

  window.addEventListener('hashchange', render);
  render();
}
