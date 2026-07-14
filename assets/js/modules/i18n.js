/* UI strings that live in JS (popover, tooltips, search). The real catalogue is
   Hugo's: the js-bridge partial emits i18n/<lang>.toml as window.THEME_I18N, and
   a site overrides individual keys the same way — documented in docs/customizing.md.
   DEFAULTS below are a last resort, for the case where the bridge never ran (a
   site that replaced scripts.html). They are English because a fallback should
   read as a fallback, not as one particular site's language. */
const DEFAULTS = {
  themeHead: 'Theme',
  popoverAria: 'Theme',
  pinPanel: 'pin panel',
  keyOr: 'or',
  focusEnter: '<kbd class="kb">F</kbd> leave focus',
  focusExitTip: 'Leave focus',
  focusTitle: 'Focus: text only (F)',
  focusAria: 'Focus: hide the rails and the header (F)',
  searchAria: 'Search the guides',
  searchPlaceholder: 'search a guide, a series, a topic…',
  searchEmpty: 'Nothing found. Try «gc», «slice», «scheduler»…',
  searchUnbuilt: 'The search index is not built yet. Build it with pagefind --site public.',
  scrollTop: 'Back to top',
  minutes: 'min',
  /* tags page (/tags/) filter */
  tagFeedHead: 'feed',
  tagReset: 'reset',
  tagEmptyTail: ' — no such tag. Check the link, or pick a topic from the cloud above.',
  guideForms: { '1': 'guide', '2': 'guides' },
};

export const I18N = Object.assign({}, DEFAULTS,
  (typeof window !== 'undefined' && window.THEME_I18N) || {});

/* Plurals without a rule table. Hugo owns the CLDR catalogue and renders one word
   per probe count, so a plural form arrives as {count: word}; Intl.PluralRules is
   that same CLDR data, and asking it which probe falls in the same category as the
   real count is the whole algorithm. Nothing here has to know that 5 is "many" in
   Russian and an unremarkable "other" in English. Falls back to the last probe —
   the plainest form — when Intl is missing or the language wants a category Hugo
   was never asked for. */
const RULES = (function () {
  try {
    return new Intl.PluralRules(document.documentElement.lang || 'en');
  } catch (e) {
    return null;
  }
})();

export function plural(n, forms) {
  const counts = Object.keys(forms || {});
  if (!counts.length) return '';
  if (RULES) {
    const want = RULES.select(n);
    for (let i = 0; i < counts.length; i++) {
      if (RULES.select(Number(counts[i])) === want) return forms[counts[i]];
    }
  }
  return forms[counts[counts.length - 1]];
}
