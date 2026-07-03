/*! silk-reorder v0.1.0 | MIT | https://github.com/skiv/silk-reorder#readme */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else root.silkReorder = factory();
}(typeof self !== "undefined" ? self : this, function () {
"use strict";
/*!
 * silk-reorder — pointer-drag reordering with FLIP flow.
 *
 * A tiny, framework-agnostic engine for the *feel* of dragging a list item to a
 * new position: instant grab/drop, neighbours that flow out of the way like they
 * have weight, targeting by the dragged item's leading edge. It knows only about
 * the DOM and pointers — never about your data. Its single output is an event:
 * "the item at index A moved to index B". You reorder your own array and re-render.
 *
 * See docs/design-notes.md for *why* it feels the way it does, and docs/api.md
 * for the full reference. MIT licensed.
 */
"use strict";

/* @pure-target-start
   computeGapTarget — choose the placeholder gap's new slot index from the
   floating item's edges vs the REAL neighbours' midpoints. Symmetric, low
   amplitude (~half a row per swap), with a small hysteresis band H.

   Contract (all numbers in ONE layout frame, see the caller):
     chipTop/chipBottom  floating block's top/bottom edges
     slots[]             {top,height} of the real neighbours, top->bottom,
                         EXCLUDING the gap and the floating block
     gapIndex            current hole index = # of reals above the gap (0..n)
     H                   hysteresis half-band in px

   Pure: depends only on its args (no DOM, no transforms), so it is unit-tested
   headless in test/reorder.test.mjs. */
function computeGapTarget(o) {
  const chipTop = o.chipTop, chipBottom = o.chipBottom, slots = o.slots, H = o.H || 0;
  const n = slots.length;
  let target = o.gapIndex;
  if (target < 0) target = 0; if (target > n) target = n;
  const start = target;
  // DOWN: bottom edge clears the midpoint of the neighbour just below the hole.
  // Neighbours below the hole keep their layout position as the hole descends
  // past the ones above them, so a single static snapshot drives multi-slot
  // jumps correctly in one pass.
  while (target < n && chipBottom > slots[target].top + slots[target].height / 2 + H) target++;
  // UP only if we did NOT move down. Down and up are mutually exclusive (item
  // height < slot stride), and running UP from a moved-down target would re-test
  // a just-passed neighbour at its stale (pre-move) position and bounce the swap
  // straight back — the classic "can't drag to the last slot" bug.
  if (target === start) {
    while (target > 0 && chipTop < slots[target - 1].top + slots[target - 1].height / 2 - H) target--;
  }
  return target;
}
/* @pure-target-end */

// Native interactive controls inside an item should behave normally (click a
// delete button, focus an input) rather than starting a drag. Without a `handle`
// option, a pointerdown on one of these is ignored by the engine.
const INTERACTIVE = "button, a, input, select, textarea, [contenteditable]";

const DEFAULTS = {
  itemSelector: null,                        // required: what counts as a row
  handle: null,                              // optional: only start drag from here
  disabled: false,                           // start inert; toggle via setDisabled
  durationMs: 200,                           // neighbour flow duration (the tasty bit)
  easing: "cubic-bezier(.42,0,.58,1)",       // ease-in-out — bubble-like flow
  hysteresis: null,                          // null => auto ~= height*0.12 in [3,8]px
  axis: "y",                                 // vertical list only (see non-goals)
  draggingClass: "silk-dragging",            // applied to the lifted item
  placeholderClass: "silk-placeholder",      // applied to the hole element
  onReorder: null,                           // (fromIndex, toIndex) => void
};

const reduceMotion = () => {
  try {
    return typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) { return false; }
};

/**
 * silkReorder(listEl, options) -> { destroy, setDisabled }
 * Attach drag-to-reorder to a vertical list. See docs/api.md.
 */
function silkReorder(listEl, options) {
  if (!listEl || listEl.nodeType !== 1) {
    throw new TypeError("silkReorder: listEl must be a DOM element");
  }
  const opts = Object.assign({}, DEFAULTS, options);
  if (!opts.itemSelector) throw new TypeError("silkReorder: itemSelector is required");
  if (opts.axis !== "y" && typeof console !== "undefined") {
    console.warn("silk-reorder: only axis 'y' is supported; falling back to 'y'");
  }

  let drag = null;               // active-drag state, or null
  let disabled = !!opts.disabled;
  let restoreListPos = null;     // inline position we set on the list, to undo

  // Live list of item elements in DOM order (excludes the placeholder).
  function items() {
    return Array.from(listEl.children).filter(
      (c) => c.nodeType === 1 && c.matches(opts.itemSelector)
    );
  }

  // The flow during a drag: real neighbours + the placeholder, in DOM order,
  // with the floating item excluded. This is the frame `computeGapTarget` reasons
  // about, and the set that FLIP animates.
  function flowOf(d) {
    return Array.from(listEl.children).filter(
      (c) => c === d.placeholder
        || (c !== d.item && c.nodeType === 1 && c.matches(opts.itemSelector))
    );
  }

  function hysteresisFor(h) {
    if (opts.hysteresis != null) return opts.hysteresis;
    return Math.max(3, Math.min(8, h * 0.12));       // light band ~= 6px at h=48
  }

  // --- FLIP, interruption-safe -------------------------------------------------
  // Snapshot the resting rects of a set of elements (First).
  function snap(els) {
    const m = new Map();
    for (const el of els) m.set(el, el.getBoundingClientRect());
    return m;
  }
  // Invert from the snapshot to the current layout, then play. The subtlety:
  // clear any in-flight transform BEFORE measuring the final rect, so rapid
  // back-and-forth swaps glide instead of drifting against a moving target.
  function play(els, first, ms, easing) {
    if (reduceMotion() || !first.size) return;
    const moved = [];
    for (const el of els) {
      const a = first.get(el); if (!a) continue;
      el.style.transition = "none";
      el.style.transform = "";                          // drop any in-flight transform…
      const b = el.getBoundingClientRect();             // …so b is the pure final layout
      const dx = a.left - b.left, dy = a.top - b.top;
      if (!dx && !dy) continue;
      el.style.transform = `translate(${dx}px,${dy}px)`; // invert: jump back to where it was
      moved.push(el);
    }
    if (!moved.length) return;
    void listEl.offsetWidth;                            // one reflow flushes the inversion…
    for (const el of moved) {                            // …then release — glides THIS frame
      el.style.transition = `transform ${ms}ms ${easing}`;
      el.style.transform = "";
      el.addEventListener("transitionend", function h() {
        el.style.transition = "";
        el.removeEventListener("transitionend", h);
      }, { once: true });
    }
  }

  function clearTransforms(els) {
    for (const el of els) { el.style.transition = ""; el.style.transform = ""; }
  }

  // --- pointer lifecycle -------------------------------------------------------
  function onDown(e) {
    if (disabled || drag) return;
    if (e.button != null && e.button !== 0) return;      // left button / touch only
    const item = e.target.closest ? e.target.closest(opts.itemSelector) : null;
    if (!item || !listEl.contains(item)) return;
    if (opts.handle) {
      const h = e.target.closest(opts.handle);
      if (!h || !item.contains(h)) return;               // must grab the handle
    } else {
      const ctrl = e.target.closest(INTERACTIVE);
      if (ctrl && item.contains(ctrl)) return;           // let controls do their thing
    }
    e.preventDefault();

    const list = items();
    const from = list.indexOf(item);
    if (from < 0) return;

    const rect = item.getBoundingClientRect();

    // Absolute positioning needs a positioned ancestor; make the list one if the
    // page hasn't. We restore exactly what we touched on drop.
    if (typeof getComputedStyle === "function"
        && getComputedStyle(listEl).position === "static") {
      restoreListPos = listEl.style.position;
      listEl.style.position = "relative";
    }
    const parentRect = listEl.getBoundingClientRect();

    // Placeholder holds the row's height so the list keeps its size. Same tag as
    // the item so it inherits the same flex/grid layout box. Keyed into the FLIP
    // (it's part of the flow) so the hole glides too — no teleport.
    const placeholder = document.createElement(item.tagName);
    if (opts.placeholderClass) placeholder.className = opts.placeholderClass;
    placeholder.style.height = rect.height + "px";
    placeholder.style.boxSizing = "border-box";
    item.parentNode.insertBefore(placeholder, item);

    // Float the item. Grab is instant: apply the lift with no transition (the CSS
    // class carries the look; we only own layout here).
    const prev = {
      position: item.style.position, left: item.style.left, top: item.style.top,
      width: item.style.width,
    };
    if (opts.draggingClass) item.classList.add(opts.draggingClass);
    item.style.position = "absolute";
    item.style.left = (rect.left - parentRect.left) + "px";
    item.style.top = (rect.top - parentRect.top) + "px";
    item.style.width = rect.width + "px";

    drag = { item, placeholder, from, grabDY: e.clientY - rect.top, prev, pointerId: e.pointerId };
    try { item.setPointerCapture(e.pointerId); } catch (_) {}
    if (document.body) document.body.style.cursor = "grabbing";
  }

  function onMove(e) {
    if (!drag) return;
    e.preventDefault();
    const pr = listEl.getBoundingClientRect();

    // Move the floating item with the pointer, clamped inside the list box.
    const maxTop = pr.height - drag.item.offsetHeight;
    let top = e.clientY - pr.top - drag.grabDY;
    top = Math.max(0, Math.min(top, Math.max(0, maxTop)));
    drag.item.style.top = top + "px";

    // Decide the target slot in LAYOUT coords (offsetTop/offsetHeight), never
    // getBoundingClientRect: neighbours are usually mid-FLIP, and screen rects
    // would report their flying (transformed) position and bounce the swaps.
    const flow = flowOf(drag);
    const reals = flow.filter((c) => c !== drag.placeholder);
    const gapIndex = flow.indexOf(drag.placeholder);
    const slots = reals.map((c) => ({ top: c.offsetTop, height: c.offsetHeight }));
    const chipTop = drag.item.offsetTop, chipBottom = chipTop + drag.item.offsetHeight;
    const H = hysteresisFor(drag.item.offsetHeight);
    const target = computeGapTarget({ chipTop, chipBottom, slots, gapIndex, H });

    if (target !== gapIndex) {
      const before = reals[target] || null;            // reals excludes gap -> 1:1 index
      const first = snap(flow);
      if (before) listEl.insertBefore(drag.placeholder, before);
      else listEl.appendChild(drag.placeholder);
      play(flow, first, opts.durationMs, opts.easing); // neighbours (and the hole) flow
    }
  }

  // Restore the floating item to a normal, in-flow element (exactly the inline
  // styles we set) and drop the placeholder. Instant — no settle animation.
  function unfloat(d) {
    const { item, placeholder } = d;
    if (opts.draggingClass) item.classList.remove(opts.draggingClass);
    item.style.position = d.prev.position;
    item.style.left = d.prev.left;
    item.style.top = d.prev.top;
    item.style.width = d.prev.width;
    item.style.transition = "";
    item.style.transform = "";
    try { item.releasePointerCapture(d.pointerId); } catch (_) {}
    if (placeholder.parentNode) placeholder.remove();
    clearTransforms(items());                          // land everything at once
    if (document.body) document.body.style.cursor = "";
    if (restoreListPos !== null) { listEl.style.position = restoreListPos; restoreListPos = null; }
  }

  function endDrag() {
    if (!drag) return;
    const d = drag;
    // Final index = placeholder's position among [reals + placeholder].
    const flow = flowOf(d);
    const to = flow.indexOf(d.placeholder);
    const from = d.from;
    unfloat(d);
    drag = null;                                        // clear before we hand off
    if (to > -1 && from > -1 && from !== to && typeof opts.onReorder === "function") {
      opts.onReorder(from, to);                         // the ONLY thing we tell the consumer
    }
  }

  function onUp(e) { if (drag) { e.preventDefault(); endDrag(); } }
  function onCancel() { if (drag) endDrag(); }

  listEl.addEventListener("pointerdown", onDown);
  listEl.addEventListener("pointermove", onMove);
  listEl.addEventListener("pointerup", onUp);
  listEl.addEventListener("pointercancel", onCancel);

  return {
    destroy() {
      if (drag) { unfloat(drag); drag = null; }         // abort without firing onReorder
      listEl.removeEventListener("pointerdown", onDown);
      listEl.removeEventListener("pointermove", onMove);
      listEl.removeEventListener("pointerup", onUp);
      listEl.removeEventListener("pointercancel", onCancel);
    },
    setDisabled(v) { disabled = !!v; },
  };
}
silkReorder.computeGapTarget = computeGapTarget;
silkReorder.silkReorder = silkReorder;   // named-import interop
silkReorder.default = silkReorder;         // esModule interop
return silkReorder;
}));

"use strict";
/* ============================================================
   Inline widgets — lightweight in-flow versions. Vanilla JS.
   Shared layout/grow math kept tiny and pure for the self-test.
   ============================================================ */
var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function $(id){ return document.getElementById(id); }
function el(tag,cls){ var e=document.createElement(tag); if(cls) e.className=cls; return e; }
function tick(node){ if(RM||!node) return; node.classList.remove('tick'); void node.offsetWidth; node.classList.add('tick'); }
function flash(node){ if(RM||!node) return; node.classList.remove('flash'); void node.offsetWidth; node.classList.add('flash'); node.addEventListener('animationend',function(){ node.classList.remove('flash'); },{once:true}); }

/* ---- shared math (pure) ---- */
var SIZES={ bool:{s:1,a:1}, int64:{s:8,a:8} };
function alignUp(off,a){ return (off + a - 1) & ~(a - 1); }
// layout: returns {size, useful, pad, items:[{type,size,offset}]}
function layout(fs){
  var off=0, sAlign=1, useful=0, items=[];
  for(var i=0;i<fs.length;i++){
    var t=fs[i], d=SIZES[t]; off=alignUp(off,d.a);
    items.push({type:t, size:d.s, offset:off}); off+=d.s; useful+=d.s; sAlign=Math.max(sAlign,d.a);
  }
  return { size:alignUp(off,sAlign), useful:useful, pad:alignUp(off,sAlign)-useful, items:items };
}
// Go growslice rule (simplified): 2x under 256, ~1.25x above. Size classes not modeled.
function grow(cap){ return cap < 256 ? cap * 2 : cap + ((cap + 3*256) >> 2); }
// gc cost counters: []T -> 1 object / 0 ptrs ; []*T -> 1+N objects / N ptrs
function gcCost(n){ return { val:{obj:1,ptr:0}, ptr:{obj:1+n,ptr:n} }; }

/* byte-segment builder for a layout (field cells + padding cells) */
function buildByteStrip(host, fs){
  host.innerHTML='';
  var L=layout(fs), cur=0, fcls=['f1','f0','f2']; // index by field order: UserID(int64)->f1 etc; we map per field below
  // build segments in address order
  var segs=[], fieldColorByType={ int64:'f1', bool:'f0' };
  var seenBool=0;
  for(var i=0;i<L.items.length;i++){
    var it=L.items[i];
    // a gap before this field is alignment padding for THIS field's type
    if(it.offset>cur) segs.push({pad:true, bytes:it.offset-cur, tail:false, nextType:it.type});
    var cls = it.type==='int64' ? 'f1' : (seenBool++===0 ? 'f0' : 'f2');
    segs.push({pad:false, bytes:it.size, type:it.type, cls:cls, offset:it.offset});
    cur=it.offset+it.size;
  }
  if(L.size>cur) segs.push({pad:true, bytes:L.size-cur, tail:true});
  var addr=0;
  for(var s=0;s<segs.length;s++){
    var sg=segs[s];
    var seg=el('div','byte-seg'), cells=el('div','cells');
    // field name by role (matches both field orders): int64 -> UserID, 1st bool -> IsSent, 2nd -> IsRead
    var fname = sg.pad ? null : (sg.type==='int64'?'UserID':(sg.cls==='f0'?'IsSent':'IsRead'));
    var tip = sg.pad
      ? (sg.tail
          ? ('padding · '+sg.bytes+' Б — '+(sg.bytes===1?'добивка':'хвостовая добивка')+' до выравнивания структуры')
          : ('padding · '+sg.bytes+' Б — выравнивание '+sg.nextType+(sg.nextType==='int64'?' (хочет адрес ×8)':'')))
      : (fname+' · '+sg.type+' · '+sg.bytes+' Б · смещение '+sg.offset);
    for(var k=0;k<sg.bytes;k++){
      var c=el('div','byte-box'+(sg.pad?' pad':' '+sg.cls)); c.textContent=addr; addr++;
      c.setAttribute('data-tip', tip); cells.appendChild(c);
    }
    var tag=el('div','seg-tag'+(sg.pad?' padtag':''));
    tag.textContent = sg.pad ? ('↳ pad '+sg.bytes) : (sg.type==='int64'?'UserID (int64)':(sg.cls==='f0'?'IsSent':'IsRead'));
    seg.appendChild(cells); seg.appendChild(tag); host.appendChild(seg);
  }
  return L;
}

/* Padding explorer — ported as-is from
   the standalone l1-layout-explorer sandbox (the "Padding" tool).
   Wrapped in an IIFE so its top-level TYPES/layout/$/RM don't collide with
   shared.js; DOM ids are prefixed lp-. Styles: css/widgets/padding-explorer.css
   (scoped under .l1pad). TODO(polish): align styling/naming with the article. */
(function(){
"use strict";
if(!document.getElementById('lp-fields')) return;  // widget markup not on page
/* размеры/выравнивания на 64-бит */
const TYPES = {
  bool:   {s:1,a:1,label:'bool'},
  int8:   {s:1,a:1,label:'int8'},
  int16:  {s:2,a:2,label:'int16'},
  int32:  {s:4,a:4,label:'int32'},
  int64:  {s:8,a:8,label:'int64'},
  float64:{s:8,a:8,label:'float64'},
  ptr:    {s:8,a:8,label:'*T'},
  string: {s:16,a:8,label:'string'},
  slice:  {s:24,a:8,label:'[]T'},
};
const COLORS = ['--accent-amber','--accent-green','--accent-gold','--accent-copper','--accent-red'];
const MAX_FIELDS = 24;                // sane cap on struct field count
let fields = ['bool','int64','bool'];   // init = типы Message{IsSent bool; UserID int64; IsRead bool}

const alignUp = (off,a)=> (off + a - 1) & ~(a - 1);

/* Minimal-size field order: stable sort by alignment desc, then size desc.
   Every type here has size = multiple of align and power-of-two align, so
   descending-alignment packing yields ZERO internal padding (only minimal
   trailing pad to struct align) — provably the smallest possible sizeof.
   Returns indices into the input array (a permutation), preserving original
   relative order for full ties (stable). */
function optimalOrder(fs){
  return fs.map((t,i)=>({t,i}))
           .sort((x,y)=>{
             const A=TYPES[x.t], B=TYPES[y.t];
             return (B.a-A.a) || (B.s-A.s) || (x.i-y.i);   // align↓, size↓, stable
           })
           .map(o=>o.i);
}

function layout(fs){
  let off=0, sAlign=1, useful=0;
  const items = fs.map((t,i)=>{
    const {s,a}=TYPES[t]; off=alignUp(off,a);
    const it={type:t,size:s,align:a,offset:off,color:COLORS[i%COLORS.length]};
    off+=s; useful+=s; sAlign=Math.max(sAlign,a); return it;
  });
  const size = alignUp(off,sAlign);
  return {items,size,align:sAlign,useful,pad:size-useful};
}

function segments(L){
  let cur=0; const segs=[];
  for(const it of L.items){
    if(it.offset>cur) segs.push({pad:true,bytes:it.offset-cur});
    segs.push({pad:false,bytes:it.size,type:it.type,color:it.color});
    cur=it.offset+it.size;
  }
  if(L.size>cur) segs.push({pad:true,bytes:L.size-cur});
  return segs;
}

/* ───────────────────────────── rendering ─────────────────────────────
   Keyed reconciliation: each struct field gets a stable id so chip and
   byte-cell DOM nodes survive a reorder. That stability is what makes
   FLIP meaningful — we measure old rects, mutate, then invert+play. */
const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
let uid = 0;                       // monotonic field id
let ids = [];                      // parallel to `fields`: stable id per slot
const FLIP_MS = 230,      // add / remove / preset / optimize chip flips
      GRID_MS = 220,      // byte-grid cells reflow
      REORDER_MS = 200;   // neighbour shuffle WHILE dragging — smooth flow (tune to taste)

const $ = id => document.getElementById(id);
const fc = $('lp-fields'), gridEl = $('lp-grid'), readoutEl = $('lp-readout'), live = $('lp-srlive');

/* keep ids[] aligned with fields[] without losing identity on reorder.
   We only call this for whole-array replacements (presets/clear). For
   single ops (add/remove/move) we maintain ids[] directly so identity holds. */
function syncIds(){ while(ids.length<fields.length) ids.push(++uid); ids.length=fields.length; }

function speak(msg){ if(live){ live.textContent=''; live.textContent=msg; } }

/* snapshot bounding rects of all keyed nodes inside a container */
function snap(container){
  const m=new Map();
  container.querySelectorAll('[data-key]').forEach(n=>m.set(n.dataset.key,n.getBoundingClientRect()));
  return m;
}
/* FLIP: invert deltas from `first` rects to current layout, then play */
function play(container,first,ms,ease){
  if(RM||!first.size) return;
  const moved=[];
  container.querySelectorAll('[data-key]').forEach(n=>{
    const a=first.get(n.dataset.key); if(!a) return;
    n.style.transition='none';
    n.style.transform='';                               // drop any in-flight transform first…
    const b=n.getBoundingClientRect();                  // …so b is the pure FINAL layout position
    const dx=a.left-b.left, dy=a.top-b.top;             // (interruption-safe: handles rapid swaps)
    if(!dx&&!dy) return;
    n.style.transform=`translate(${dx}px,${dy}px)`;     // invert: jump back to where it visually was
    moved.push(n);
  });
  if(!moved.length) return;
  void container.offsetWidth;                           // one reflow flushes the inverted state…
  moved.forEach(n=>{                                    // …then release — transition starts THIS frame,
    n.style.transition=`transform ${ms}ms ${ease||'var(--ease)'}`; // so it glides instead of teleporting
    n.style.transform='';
    n.addEventListener('transitionend',function h(){ n.style.transition=''; n.removeEventListener('transitionend',h); },{once:true});
  });
}

/* build (or reuse) one chip element for slot i */
function buildChip(it,i,key){
  let el=fc.querySelector(`.chip[data-key="${key}"]`);
  const fresh=!el;
  if(fresh){
    el=document.createElement('li');
    el.className='chip'; el.dataset.key=key;
    el.innerHTML=
      `<span class="idx"></span>`+
      `<span class="nm"></span>`+
      `<span class="meta"></span>`+
      `<span class="ofs"></span>`+
      `<button class="rm" type="button" aria-label="удалить поле" title="удалить">×</button>`;
  }
  el.style.borderLeftColor=`var(${it.color})`;
  el.querySelector('.idx').textContent=(i+1);
  el.querySelector('.nm').textContent=TYPES[it.type].label;
  el.querySelector('.meta').textContent=`${it.size}B · align ${it.align}`;
  el.querySelector('.ofs').textContent=`@${it.offset}`;
  el.setAttribute('aria-label',`Поле ${i+1} из ${fields.length}: ${TYPES[it.type].label}, ${it.size} байт, выравнивание ${it.align}, смещение ${it.offset}`);
  return el;
}

/* render the byte-grid with keyed cells (key = byte address) so FLIP works */
function renderGrid(L,prevSize){
  if(!fields.length){ gridEl.innerHTML='<span style="color:var(--text-ghost);font-size:13px">—</span>'; return; }
  const first=snap(gridEl);
  gridEl.innerHTML='';
  // Reuse the article's byte cells (.byte-seg/.byte-box/.seg-tag) + rich data-tip,
  // so the polished floating tooltip (.l1-tip, delegated on document) lights up
  // for free instead of the native browser title.
  const segs=segments(L);
  let addr=0;
  for(let si=0;si<segs.length;si++){
    const sg=segs[si];
    const wrap=document.createElement('div'); wrap.className='byte-seg';
    const cells=document.createElement('div'); cells.className='cells';
    let tip, tagTxt;
    if(sg.pad){
      const next=segs[si+1];
      const why=(next && !next.pad)
        ? `выравнивание под ${TYPES[next.type].label} (хочет адрес ×${TYPES[next.type].a})`
        : `хвостовая добивка до align ${L.align}`;
      tip=`padding · ${sg.bytes} Б · ${why}`;
      tagTxt=`↳ pad ${sg.bytes}`;
    }else{
      const t=TYPES[sg.type];
      tip=`${t.label} · поле · ${sg.bytes} Б · align ${t.a} · смещение @${addr}`;
      tagTxt=t.label;
    }
    for(let k=0;k<sg.bytes;k++){
      const c=document.createElement('div');
      c.className='byte-box'+(sg.pad?' pad':'');
      c.dataset.key='b'+addr;                       // address-stable key (FLIP)
      if(!sg.pad) c.style.background=`var(${sg.color})`;
      c.textContent=addr;
      c.setAttribute('data-tip',tip);               // → floating .l1-tip tooltip
      cells.appendChild(c); addr++;
    }
    const tag=document.createElement('div'); tag.className='seg-tag'+(sg.pad?' padtag':'');
    tag.textContent=tagTxt;
    wrap.appendChild(cells); wrap.appendChild(tag); gridEl.appendChild(wrap);
  }
  play(gridEl,first,GRID_MS);
}

let prevSize=null;
function render(opts){
  opts=opts||{};
  syncIds();
  const L=layout(fields);

  // FLIP for chips: measure, reorder DOM in place, invert+play
  const firstChips = opts.flip ? snap(fc) : null;
  fc.classList.toggle('is-empty',!fields.length);

  // reconcile chip order using stable keys
  const wanted=[];
  L.items.forEach((it,i)=>{ wanted.push(buildChip(it,i,ids[i])); });
  // remove stale chips
  Array.from(fc.children).forEach(ch=>{ if(!wanted.includes(ch)) ch.remove(); });
  // (re)append in correct order — appendChild moves existing nodes
  wanted.forEach(el=>fc.appendChild(el));
  if(firstChips) play(fc,firstChips,FLIP_MS);

  // readout + sizeof tick
  const sizeChanged = prevSize!=null && prevSize!==L.size;
  readoutEl.innerHTML = fields.length
    ? `<span>sizeof = <b id="lp-szb">${L.size}</b> B</span><span class="u">полезных ${L.useful}</span><span class="p">padding ${L.pad}</span><span class="muted">align ${L.align}</span>`
    : `<span class="muted">пустая структура → 0 B</span>`;
  if(sizeChanged && !RM){ const b=$('lp-szb'); if(b){ void b.offsetWidth; b.classList.add('tick'); } }

  renderGrid(L,prevSize);
  prevSize=L.size;
  if(typeof refreshCap==='function') refreshCap();   // keep palette cap state in sync
}

/* ───────────────────────────── palette ─────────────────────────────── */
const pal=$('lp-palette');
const palHint=$('lp-palHint');
const palBtns=[];
Object.keys(TYPES).forEach(t=>{
  const b=document.createElement('button'); b.className='ptype'; b.type='button';
  b.innerHTML=`${TYPES[t].label} <span>${TYPES[t].s}B</span>`;
  b.setAttribute('aria-label',`добавить поле ${TYPES[t].label}`);
  b.onclick=()=>{
    if(fields.length>=MAX_FIELDS){ refreshCap(); speak(`Достигнут максимум ${MAX_FIELDS} полей.`); return; }
    fields.push(t); ids.push(++uid); render({flip:true}); speak(`Добавлено поле ${TYPES[t].label}.`);
  };
  palBtns.push(b);
  pal.appendChild(b);
});
/* reflect the field cap in the palette: disable adds + show a subtle hint */
function refreshCap(){
  const atCap=fields.length>=MAX_FIELDS;
  palBtns.forEach(b=>{ b.disabled=atCap; b.setAttribute('aria-disabled',atCap?'true':'false'); });
  if(palHint) palHint.style.display=atCap?'inline':'none';
}

/* presets / clear (whole-array replacement → identity reset is fine) */
$('lp-demoBtn').onclick=()=>{ fields=['bool','int64','bool']; ids=[]; render({flip:true}); speak('Пример: bool, int64, bool.'); };
$('lp-clearBtn').onclick=()=>{ fields=[]; ids=[]; render({flip:true}); speak('Структура очищена.'); };

/* OPTIMIZE: reorder the user's CURRENT fields into the minimal-size layout,
   in place (no reset). Keep ids[] in step so chips/byte-cells keep identity →
   the existing FLIP path animates them sliding (snaps under reduced-motion). */
$('lp-optBtn').onclick =()=>{
  if(!fields.length){ speak('Нет полей для оптимизации.'); return; }
  const before=layout(fields).size;
  const order=optimalOrder(fields);
  // already optimal (order is identity)? nothing to move
  if(order.every((v,i)=>v===i)){ speak('Уже оптимально — переставлять нечего.'); return; }
  fields=order.map(i=>fields[i]);
  ids=order.map(i=>ids[i]);                 // permute identity in lock-step
  render({flip:true});
  const after=layout(fields).size;
  speak(`Оптимизировано: поля переставлены по убыванию выравнивания. sizeof ${before}→${after} B.`);
};

/* ───────────────── reorder + delete (shared commit path) ────────────── */
function removeAt(i){
  const label=TYPES[fields[i]].label;
  fields.splice(i,1); ids.splice(i,1);
  render({flip:true}); speak(`Удалено поле ${label}.`);
}
function moveField(from,to){
  if(to<0||to>=fields.length||from===to) return false;
  fields.splice(to,0,fields.splice(from,1)[0]);
  ids.splice(to,0,ids.splice(from,1)[0]);
  return true;
}

/* delete button (event-delegated; works for both mouse & keyboard) */
fc.addEventListener('click',e=>{
  const rm=e.target.closest('.rm'); if(!rm) return;
  const chip=rm.closest('.chip'); const i=Array.from(fc.children).indexOf(chip);
  if(i>-1) removeAt(i);
});

/* keyboard reordering removed — mouse-only; speak() kept for SR announcements */

/* ───────────────── pointer drag-and-drop reordering ─────────────────── */
/* The drag physics — pointer capture, FLIP neighbour flow, leading-edge slot
   targeting, instant grab/drop — now live in the silk-reorder library, inlined
   by build.mjs as the global `silkReorder`. It is decoupled from our model:
   its only output is onReorder(from,to). The array move + re-render + SR
   announcement stay here, exactly as the old inline endDrag did. */
if (typeof window.silkReorder === 'function') {
  window.silkReorder(fc, {
    itemSelector: '.chip',
    draggingClass: 'dragging',      // keep the existing .chip.dragging styles
    placeholderClass: 'chip-gap',   // keep the existing .chip-gap hole styles
    onReorder(from, to) {
      moveField(from, to);          // permute fields[] + ids[] in lock-step
      render();                     // cells FLIP inside; chips land instantly
      speak(`${TYPES[fields[to]].label} → позиция ${to + 1} из ${fields.length}.`);
    },
  });
}

render();   // initial paint — load with the article's struct; empty-state placeholder works after «очистить»
})();

/* ===== Widget 1: PADDING ===== */
(function(){
  var host=$('w-padding'); if(!host) return;
  // two field orders: bad = {IsSent,UserID,IsRead} (24B) ; good = {UserID,IsSent,IsRead} (16B)
  var BAD=['bool','int64','bool'], GOOD=['int64','bool','bool'];
  var optimized=false;
  var row=el('div','w-row');
  var btn=el('button','w-btn primary'); btn.type='button'; btn.textContent='переставить поля';
  var num=el('div','w-num');
  row.appendChild(btn); row.appendChild(num);
  var decl=el('div'); decl.style.cssText='font-family:var(--font-mono);font-size:12.5px;color:var(--text-secondary);margin-bottom:10px';
  var strip=el('div','byte-strip');
  var cap=el('div','w-cap');
  host.appendChild(row); host.appendChild(decl); host.appendChild(strip); host.appendChild(cap);
  function paint(){
    var fs = optimized ? GOOD : BAD;
    var L=buildByteStrip(strip, fs);
    decl.innerHTML = optimized
      ? 'Message{ UserID int64; IsSent bool; IsRead bool }'
      : 'Message{ IsSent bool; UserID int64; IsRead bool }';
    num.innerHTML='Sizeof = <b id="pad-sz">'+L.size+'</b> B <span class="u">полезных '+L.useful+'</span> <span class="p">padding '+L.pad+'</span>';
    cap.innerHTML = optimized
      ? 'Тяжёлое <b>int64</b> вперёд → дыра исчезла, остался лишь хвостовой <b>pad 6</b>. <span class="grew">24 → 16 байт.</span>'
      : 'Между <code>IsSent</code> и <code>UserID</code> зияет <b>pad 7</b> (int64 хочет адрес ×8) и ещё хвостовой <b>pad 7</b>. 14 байт воздуха.';
    btn.textContent = optimized ? 'вернуть как было' : 'переставить поля';
  }
  btn.addEventListener('click', function(){
    optimized=!optimized; paint();
    requestAnimationFrame(function(){ tick($('pad-sz')); });
  });
  paint();
})();

/* ===== Widget 2: SLICE (append + realloc on len==cap) ===== */
(function(){
  var host=$('w-slice'); if(!host) return;
  var S={ ptr:0, len:3, cap:8, fill:[0,1,2], nextVal:30, generation:0 };
  // header
  var hdr=el('div','header');
  function hw(k,id,extra){ var w=el('div','header-word'+(extra?' '+extra:'')); var wk=el('span','wk'); wk.textContent=k; var wv=el('span','wv'); wv.id=id; w.appendChild(wk); w.appendChild(wv); return w; }
  hdr.appendChild(hw('ptr','sl-ptr','ptr')); hdr.appendChild(hw('len','sl-len')); hdr.appendChild(hw('cap','sl-cap-v'));
  var lab=el('div','mem-lab'); lab.style.marginTop='12px'; lab.textContent='backing-массив';
  var backing=el('div','mem-row');
  var row=el('div','w-row'); row.style.marginTop='14px';
  var bAppend=el('button','w-btn primary'); bAppend.type='button'; bAppend.textContent='append(s, x)';
  var bReset=el('button','w-btn ghost'); bReset.type='button'; bReset.textContent='reset';
  row.appendChild(bAppend); row.appendChild(bReset);
  var cap=el('div','w-cap');
  host.appendChild(hdr); host.appendChild(lab); host.appendChild(backing); host.appendChild(row); host.appendChild(cap);
  function render(){
    $('sl-ptr').textContent='→['+S.ptr+']'; $('sl-len').textContent=S.len; $('sl-cap-v').textContent=S.cap;
    $('sl-ptr').parentNode.setAttribute('data-tip','ptr · указатель на backing[0]');
    $('sl-len').parentNode.setAttribute('data-tip','len · видимых элементов: '+S.len);
    $('sl-cap-v').parentNode.setAttribute('data-tip','cap · вместимость backing: '+S.cap);
    backing.innerHTML='';
    for(var i=0;i<S.cap;i++){
      var c=el('div','word'+(i<S.len?' live':' spare'));
      c.textContent = i<S.len ? (S.fill[i]!=null?S.fill[i]:'') : '··';
      c.setAttribute('data-tip', i<S.len ? ('видимый элемент · индекс '+i+' (в ptr[0:len))') : ('запас · индекс '+i+' (cap − len, ещё не виден)'));
      c.id='sl-cell-'+i; backing.appendChild(c);
    }
    lab.textContent='backing-массив (cap '+S.cap+')';
    bReset.disabled = (S.len===3 && S.cap===8 && S.generation===0);
  }
  bAppend.addEventListener('click', function(){
    if(S.len < S.cap){
      var idx=S.len; S.fill[idx]=S.nextVal++; S.len++;
      render(); flash($('sl-cell-'+idx));
      cap.innerHTML='len &lt; cap → записали <code>backing['+idx+']</code>, len '+(S.len-1)+'→'+S.len+'. Та же память, копирования нет.';
    } else {
      var oldCap=S.cap, newCap=grow(oldCap);
      var copied=S.fill.slice(0,S.len); copied[S.len]=S.nextVal++;
      S.fill=copied; S.len=S.len+1; S.cap=newCap; S.ptr=0; S.generation++;
      render(); flash($('sl-cell-'+(S.len-1)));
      cap.innerHTML='len == cap ('+oldCap+') → новый backing cap <b>'+newCap+'</b>, элементы скопированы, ptr перецелен. Старый массив — <span class="grew">недостижим, GC соберёт</span>.';
    }
  });
  bReset.addEventListener('click', function(){
    S={ ptr:0, len:3, cap:8, fill:[0,1,2], nextVal:30, generation:0 };
    render(); cap.innerHTML='Сброшено. len &lt; cap → есть запас.';
  });
  render(); cap.innerHTML='len &lt; cap → пишем в запас, копирования нет. Жми append до <code>len==cap</code>.';
})();

/* ===== Widget 3: RETENTION (huge[:3] vs copy) ===== */
(function(){
  var host=$('w-retention'); if(!host) return;
  var N=40, USE=3, mode='sliced'; // 'sliced' | 'copied'
  var row=el('div','w-row');
  var bSlice=el('button','w-btn'); bSlice.type='button'; bSlice.textContent='small := huge[:3]';
  var bCopy=el('button','w-btn primary'); bCopy.type='button'; bCopy.textContent='fix: small = copy(...)';
  row.appendChild(bSlice); row.appendChild(bCopy);
  var lab=el('div','mem-lab'); lab.style.marginTop='6px';
  var bar=el('div','mem-row'); bar.style.gap='1px';
  var freshLab=el('div','mem-lab'); freshLab.style.marginTop='10px'; freshLab.textContent='small →';
  var fresh=el('div','mem-row');
  var cap=el('div','w-cap');
  host.appendChild(row); host.appendChild(lab); host.appendChild(bar); host.appendChild(freshLab); host.appendChild(fresh); host.appendChild(cap);
  function render(){
    bar.innerHTML='';
    for(var i=0;i<N;i++){
      var c=el('div','word'); c.style.cssText='width:14px;height:26px;font-size:0';
      if(mode==='sliced'){
        if(i<USE){ c.classList.add('live'); c.setAttribute('data-tip','видимый байт · small = huge[:3]'); }
        else { c.style.background='var(--accent-copper-dim)'; c.style.borderColor='var(--accent-copper)'; c.setAttribute('data-tip','удержан · вне среза, но GC не соберёт'); }
      } else { c.classList.add('dead'); c.setAttribute('data-tip','недостижим · GC соберёт'); }
      bar.appendChild(c);
    }
    fresh.innerHTML='';
    if(mode==='copied'){
      freshLab.textContent='small → свежий 3-элементный массив (huge свободен)';
      for(var j=0;j<USE;j++){ var f=el('div','word live'); f.textContent=j; f.setAttribute('data-tip','копия · свой массив (huge свободен)'); fresh.appendChild(f); }
    } else {
      freshLab.textContent='small → huge[:3] (отдельного массива нет)';
    }
    lab.innerHTML = mode==='sliced'
      ? 'huge — 10 МБ backing <span style="color:var(--accent-copper)">(весь удержан через small)</span>'
      : 'huge — 10 МБ backing <span class="muted">(больше не достижим)</span>';
    bSlice.disabled = (mode==='sliced'); bCopy.disabled = (mode==='copied');
  }
  bSlice.addEventListener('click', function(){ mode='sliced'; render();
    cap.innerHTML='<code>small=huge[:3]</code>: len 3, но <b>cap дотянулся до конца</b> → GC не может собрать backing, достижим целиком.'; });
  bCopy.addEventListener('click', function(){ mode='copied'; render();
    cap.innerHTML='<code>small=copy(...)</code>: данные в свежем массиве. На huge ссылок нет → <span class="grew">GC соберёт 10 МБ</span>.'; });
  render(); cap.innerHTML='<code>huge[:3]</code> держит весь массив живым. Жми «fix», чтобы скопировать в свой и освободить huge.';
})();

/* ===== Widget 4: INTERFACE (pointer = no alloc, int = box on heap) ===== */
(function(){
  var host=$('w-iface'); if(!host) return;
  var mode='ptr'; // 'ptr' | 'int'
  var row=el('div','w-row');
  var bPtr=el('button','w-btn'); bPtr.type='button'; bPtr.textContent='var x any = p   (p = *Point)';
  var bInt=el('button','w-btn'); bInt.type='button'; bInt.textContent='var y any = 1000';
  row.appendChild(bPtr); row.appendChild(bInt);
  var pair=el('div','if-pair');
  pair.innerHTML='<div class="if-w" data-tip="*_type · дескриптор типа (any)"><span class="wk">*_type</span><span class="wv">any</span></div><div class="if-w dataw" data-tip="data · второе слово — всегда указатель на данные"><span class="wk">data</span><span class="wv" id="if-data">→</span></div>';
  var arrow=el('div','if-target');
  arrow.innerHTML='<span class="if-arrow">└▶</span> <span id="if-box"></span>';
  var badgeWrap=el('div'); badgeWrap.style.margin='10px 0 4px';
  var cap=el('div','w-cap');
  host.appendChild(row); host.appendChild(pair); host.appendChild(arrow); host.appendChild(badgeWrap); host.appendChild(cap);
  function render(){
    var box=$('if-box'), badge;
    if(mode==='ptr'){
      box.className='if-box exist'; box.textContent='&Point{1,2} (уже в куче)';
      badgeWrap.innerHTML='<span class="w-badge ok"><span class="dot"></span>аллокации нет</span>';
      cap.innerHTML='<code>p</code> уже указатель → <code>data = p</code>. Второе слово показывает на существующий объект. <span class="grew">Новой коробки нет.</span>';
    } else {
      box.className='if-box heap'; box.textContent='[ 1000 ] коробка в куче';
      badgeWrap.innerHTML='<span class="w-badge alloc"><span class="dot"></span>аллокация!</span>';
      cap.innerHTML='<code>1000</code> — не указатель → копия <span class="hot">уезжает в кучу</span>, <code>data</code> → на неё. У int нет адреса, поэтому ему выдают ячейку.';
    }
    bPtr.disabled=(mode==='ptr'); bInt.disabled=(mode==='int');
  }
  bPtr.addEventListener('click', function(){ mode='ptr'; render(); });
  bInt.addEventListener('click', function(){ mode='int'; render(); });
  render();
})();

/* ===== Widget 5: GC COST — climax ([]T vs []*T) ===== */
(function(){
  var host=$('w-gc'); if(!host) return;
  var N=3;
  var sliderRow=el('div','gc-slider-row');
  sliderRow.innerHTML='<span>N =</span><input type="range" id="gc-n" min="1" max="64" value="3" aria-label="число точек N"><span class="nval" id="gc-nval">3</span>';
  var cols=el('div','gc-cols');
  cols.innerHTML=
    '<div class="gc-col t1"><h4>[]Point</h4><div class="gc-stats" id="gc-s1"></div><div class="gc-viz" id="gc-v1"></div></div>'+
    '<div class="gc-col t2"><h4>[]*Point</h4><div class="gc-stats" id="gc-s2"></div><div class="gc-viz" id="gc-v2"></div></div>';
  var cap=el('div','w-cap'); cap.style.marginTop='14px';
  host.appendChild(sliderRow); host.appendChild(cols); host.appendChild(cap);
  function render(){
    var c=gcCost(N);
    $('gc-nval').textContent=N;
    $('gc-s1').innerHTML='объектов под GC: <b class="hl">'+c.val.obj+'</b><br>указателей под скан: <b class="hl">'+c.val.ptr+'</b>';
    $('gc-s2').innerHTML='объектов под GC: <b class="hl">'+c.ptr.obj+'</b> <span class="muted">(1+'+N+')</span><br>указателей под скан: <b class="hl">'+c.ptr.ptr+'</b>';
    // viz 1: one solid block of N cells
    var v1=$('gc-v1'); v1.innerHTML='';
    var solid=el('div','gc-solid');
    for(var i=0;i<N;i++){ var w=el('div','word'); w.textContent=''; w.setAttribute('data-tip','Point внутри массива · без указателя, GC не сканирует'); solid.appendChild(w); }
    v1.appendChild(solid);
    var t1=el('div','mem-lab'); t1.style.marginTop='6px'; t1.textContent='1 массив, карта «чисто» — GC не сканирует';
    v1.appendChild(t1);
    // viz 2: array of N pointer-cells -> N scattered blocks
    var v2=$('gc-v2'); v2.innerHTML='';
    var ptrs=el('div','gc-ptrs');
    for(var j=0;j<N;j++){ var p=el('div','word'); p.textContent='•'; p.setAttribute('data-tip','указатель · ребро, которое GC обязан обойти'); ptrs.appendChild(p); }
    var arr=el('div','sc-arrows'); arr.textContent='│ ▼ '+N+' рёбер';
    var scat=el('div','gc-scatter');
    for(var k=0;k<N;k++){ var s=el('div','word'); s.textContent='P'+k; s.setAttribute('data-tip','*Point · отдельная аллокация в куче (+1 объект)'); scat.appendChild(s); }
    v2.appendChild(ptrs); v2.appendChild(arr); v2.appendChild(scat);
    cap.innerHTML='N = '+N+': <code>[]Point</code> = <span class="grew">1 объект / 0 указателей</span>; <code>[]*Point</code> = <span class="hot">'+c.ptr.obj+' объектов / '+c.ptr.ptr+' рёбер</span>. Те же N точек — разный счёт от GC.';
  }
  $('gc-n').addEventListener('input', function(e){ N=+e.target.value; render(); });
  render();
})();

/* ===== self-test (widget math) ===== */
(function(){
  var t=[];
  function chk(cond,name){ t.push([!!cond,name]); }
  // padding 24<->16
  chk(layout(['bool','int64','bool']).size===24, 'padding {IsSent,UserID,IsRead}=24');
  chk(layout(['int64','bool','bool']).size===16, 'padding {UserID,IsSent,IsRead}=16');
  // slice grow
  chk(grow(4)===8,   'grow(4)=8');
  chk(grow(256)===512,'grow(256)=512');
  chk(grow(8)===16,  'grow(8)=16');
  // gc-cost at N=3 : []T = 1/0 ; []*T = 4/3
  var g=gcCost(3);
  chk(g.val.obj===1 && g.val.ptr===0, 'gc []T N=3 => 1 obj / 0 ptr');
  chk(g.ptr.obj===4 && g.ptr.ptr===3, 'gc []*T N=3 => 4 obj / 3 ptr');
  console.assert(grow(4)===8, 'grow(4) should be 8');
  console.assert(grow(256)===512, 'grow(256) should be 512');
  console.assert(layout(['bool','int64','bool']).size===24 && layout(['int64','bool','bool']).size===16, 'padding 24<->16');
  var fail=t.filter(function(x){ return !x[0]; });
  console.log(fail.length ? ('SELFTEST FAIL: '+fail.map(function(x){return x[1];}).join('; ')) : ('SELFTEST PASS ('+t.length+' cases)'));
})();
