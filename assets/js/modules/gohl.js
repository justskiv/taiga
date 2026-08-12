/* Go highlighter — the client-side twin of server-side Chroma, used only by the
   live code editor (modules/codeedit.js). Reading pages never call it: their
   colour comes from Hugo's Chroma pass at build time.

   It emits the SAME class names Chroma does (.k .kd .kn .kc .kt .nb .nf .s .m
   .c1 .cm), so 20-chroma.css paints both without knowing which one produced the
   markup, and the snippet keeps its colours through every palette.

   Two hard requirements, both from the editor:
   1. Lossless. codapi runs `code.textContent` — the concatenated text of every
      token MUST equal the input byte for byte, or the reader executes something
      they never typed. Hence: no prettifying, no entity beyond HTML escaping,
      no dropped whitespace.
   2. Cheap. It re-runs on every keystroke, so it is one linear scan with no
      backtracking and no per-character DOM work.

   It is a lexer, not a parser: it never resolves what an identifier means. Two
   heuristics recover the two cases Chroma's Go lexer colours — `func name` and
   an identifier immediately before `(` become NameFunction. `Map[U any](…)` (a
   generic method declaration) stays plain, which is the one visible difference
   from a Chroma-rendered snippet. */

const NAMESPACE = new Set(['package', 'import']);
const DECLARE = new Set(['var', 'func', 'struct', 'map', 'chan', 'type', 'interface', 'const']);
const KEYWORD = new Set(['break', 'case', 'continue', 'default', 'defer', 'else',
  'fallthrough', 'for', 'go', 'goto', 'if', 'range', 'return', 'select', 'switch']);
const CONSTANT = new Set(['true', 'false', 'iota', 'nil']);
const TYPE = new Set(['any', 'bool', 'byte', 'comparable', 'complex64', 'complex128',
  'error', 'float32', 'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune',
  'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr']);
const BUILTIN = new Set(['append', 'cap', 'clear', 'close', 'complex', 'copy', 'delete',
  'imag', 'len', 'make', 'max', 'min', 'new', 'panic', 'print', 'println', 'real', 'recover']);
const ALIAS = new Set(['any', 'comparable']);

const IDENT_START = /[\p{L}_]/u;
const IDENT_PART = /[\p{L}\p{Nd}_]/u;
const DIGIT = /\d/;
/* Go numeric literals: based ints, floats, exponents, imaginary suffix, `_` separators. */
const NUMBER = /^(?:0[xX][0-9a-fA-F_]*(?:\.[0-9a-fA-F_]*)?(?:[pP][+-]?\d+)?|0[bBoO][01234567_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d+)?)i?/;

export function escapeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* wordClass maps a bare word to its Chroma token class, or '' for "leave plain"
   — identifiers, operators and punctuation, which Chroma tags (.nx .o .p) but
   20-chroma.css deliberately leaves at the body colour.

   The `callable` cases are not decoration: they are Chroma's own rule, read off
   its output (see the note above the file's tests in the changelog entry).
   A word followed by `(` is a call site, and that changes what it MEANS:

     var a uintptr     → kt   a type in type position
     c := uintptr(7)   → nb   the same word as a conversion, i.e. a call
     new := 5          → nx   a variable that happens to be named `new`
     p := new(int)     → nb   the builtin, called

   So a builtin name outside a call is just an identifier, and a type name
   inside one reads as the conversion function it is. */
function wordClass(word, prevWord, callable) {
  if (NAMESPACE.has(word)) return 'kn';
  if (DECLARE.has(word)) return 'kd';
  if (KEYWORD.has(word)) return 'k';
  if (CONSTANT.has(word)) return 'kc';
  /* `any` and `comparable` are constraint aliases, not conversions Chroma
     recognises, so they stay types even in front of a paren. */
  if (TYPE.has(word)) return callable && !ALIAS.has(word) ? 'nb' : 'kt';
  if (BUILTIN.has(word)) return callable ? 'nb' : '';
  if (prevWord === 'func' || callable) return 'nf';
  return '';
}

export function highlightGo(src) {
  let out = '';
  let plain = '';      /* run of unclassified text, flushed as one escaped chunk */
  let prevWord = '';   /* last word seen with only spaces since — powers `func name` */
  const n = src.length;
  let i = 0;

  const flush = () => { if (plain) { out += escapeHTML(plain); plain = ''; } };
  const emit = (cls, text) => {
    if (!cls) { plain += text; return; }
    flush();
    out += '<span class="' + cls + '">' + escapeHTML(text) + '</span>';
  };

  while (i < n) {
    const ch = src[i];

    /* line comment */
    if (ch === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      const end = nl < 0 ? n : nl;
      emit('c1', src.slice(i, end));
      i = end; prevWord = '';
      continue;
    }

    /* block comment — unterminated runs to the end, as the reader typed it */
    if (ch === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      const end = close < 0 ? n : close + 2;
      emit('cm', src.slice(i, end));
      i = end; prevWord = '';
      continue;
    }

    /* raw string — no escapes, may span lines */
    if (ch === '`') {
      const close = src.indexOf('`', i + 1);
      const end = close < 0 ? n : close + 1;
      emit('s', src.slice(i, end));
      i = end; prevWord = '';
      continue;
    }

    /* interpreted string / rune — escape-aware, stops at the line end so one
       unclosed quote cannot repaint the rest of the snippet */
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n && src[j] !== ch && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const end = j < n && src[j] === ch ? j + 1 : j;
      emit(ch === "'" ? 'sc' : 's', src.slice(i, end));
      i = end; prevWord = '';
      continue;
    }

    /* number — a leading dot only counts when a digit follows it */
    if (DIGIT.test(ch) || (ch === '.' && DIGIT.test(src[i + 1] || ''))) {
      const m = NUMBER.exec(src.slice(i));
      const text = m ? m[0] : ch;
      emit('m', text);
      i += text.length; prevWord = '';
      continue;
    }

    /* word: keyword, builtin, type or identifier */
    if (IDENT_START.test(ch)) {
      let j = i + 1;
      while (j < n && IDENT_PART.test(src[j])) j++;
      const word = src.slice(i, j);
      let k = j;
      while (k < n && (src[k] === ' ' || src[k] === '\t')) k++;
      emit(wordClass(word, prevWord, src[k] === '('), word);
      i = j; prevWord = word;
      continue;
    }

    /* everything else — operators, punctuation, whitespace — stays plain.
       Anything but a space between two words breaks the `func name` pairing. */
    if (ch !== ' ' && ch !== '\t') prevWord = '';
    plain += ch;
    i++;
  }

  flush();
  return out;
}
