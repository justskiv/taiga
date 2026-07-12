/* UI strings that live in JS (popover, tooltips, search). Overridable from the
   site with window.THEME_I18N — documented in docs/customizing.md. */
const DEFAULTS = {
  themeHead: 'Тема',
  popoverAria: 'Тема',
  pinPanel: 'закрепить панель',
  focusEnter: '<kbd class="kb">F</kbd> выйти из фокуса',
  focusExitTip: 'Выйти из фокуса',
  focusTitle: 'Фокус: только текст (F)',
  focusAria: 'Фокус: скрыть панели и шапку (F)',
  searchAria: 'Поиск по гайдам',
  searchPlaceholder: 'искать гайд, серию, тему…',
  searchEmpty: 'Ничего не нашлось. Попробуй «gc», «слайс», «планировщик»…',
  searchUnbuilt: 'Индекс поиска ещё не собран. Соберётся командой pagefind --site public.',
  minutes: 'мин',
  /* tags page (/tags/) filter */
  tagFeedHead: 'лента',
  tagReset: 'сбросить',
  tagEmptyTail: ' — такого тега нет. Проверь ссылку или выбери тему из облака выше.',
  guideForms: ['гайд', 'гайда', 'гайдов'],
};

export const I18N = Object.assign({}, DEFAULTS,
  (typeof window !== 'undefined' && window.THEME_I18N) || {});
