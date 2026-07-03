/* Home "guide of the week" byte-strip demo: a before/after field-layout toggle.
   Kept subject-agnostic — the two layouts (labels, tooltips, sizes) are read from
   a JSON data island (#hd-data) the site ships in its featured-demo partial, so
   the theme carries no Go/content. Inert unless #hd-strip and #hd-data both exist
   (i.e. only on the home page, only when the site opted into a demo). */
export function initFeatured() {
  const strip = document.getElementById('hd-strip');
  const island = document.getElementById('hd-data');
  if (!strip || !island) return;
  let cfg;
  try { cfg = JSON.parse(island.textContent); } catch (e) { return; }
  const order = cfg.order || [], layouts = cfg.layouts || {};
  if (!order.length) return;
  const sizeEl = document.getElementById('hd-size');
  const btn = document.getElementById('hd-btn');
  let idx = 0;

  function render() {
    const L = layouts[order[idx]];
    if (!L) return;
    strip.innerHTML = '';
    (L.segs || []).forEach(function (s) {
      const seg = document.createElement('div'); seg.className = 'byte-seg';
      const cells = document.createElement('div'); cells.className = 'cells';
      for (let k = 0; k < s.n; k++) {
        const b = document.createElement('div');
        b.className = 'byte-box ' + s.cls;
        if (s.tip) b.setAttribute('data-tip', s.tip);
        b.textContent = s.at + k;
        cells.appendChild(b);
      }
      const tag = document.createElement('div');
      tag.className = 'seg-tag' + (s.cls === 'pad' ? ' padtag' : '');
      tag.textContent = s.tag;
      seg.appendChild(cells); seg.appendChild(tag);
      strip.appendChild(seg);
    });
    if (sizeEl) { sizeEl.textContent = L.size; sizeEl.classList.remove('tick'); void sizeEl.offsetWidth; sizeEl.classList.add('tick'); }
    if (btn && L.btn) btn.textContent = L.btn;
  }

  if (btn) btn.addEventListener('click', function () { idx = (idx + 1) % order.length; render(); });
  render();
}
