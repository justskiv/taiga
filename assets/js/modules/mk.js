/* {{< mk >}} (31-data.css, "a series glyph in the text") is an empty inline
   box before a name. At the start of a cell or a line it is welded to the
   name already; inside a line it is not: the space typed after the tag is a
   break, and when a line breaks just before an empty box the box stays
   behind at the end of it — the glyph on one line, its name on the next.
   So that space goes, and the box gets a zero-width letter (is-glued adds
   U+2061 as ::after): a line may still break before the glyph, never
   between it and its word. The gap is the glyph's margin either way — a
   space after a line start or after another space was already folded away
   — so nothing moves when this runs. The Obsidian plugin draws the glued
   form from the start. */
export function glueMarks(root) {
  (root || document).querySelectorAll('.mk:not(.is-glued)').forEach(function (m) {
    const next = m.nextSibling;
    if (next && next.nodeType === 3) next.nodeValue = next.nodeValue.replace(/^[ \t\r\n\f]+/, '');
    m.classList.add('is-glued');
  });
}
