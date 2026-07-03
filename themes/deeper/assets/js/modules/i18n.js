/* UI strings that live in JS (popover, tooltips, search). Overridable from the
   site with window.DEEPER_I18N — documented in docs/customizing.md. */
const DEFAULTS = {
  themeHead: 'Тема',
  viewHead: 'Вид',
  railLeft: 'Серия слева',
  railRight: 'Оглавление',
  lists: 'Списки',
  on: 'вкл',
  off: 'выкл',
  listRows: 'строки',
  listLoud: 'громко',
  listShelf: 'полка',
  popoverAria: 'Тема и вид',
  hint: '<kbd class="kb">[</kbd>/<kbd class="kb">⌘1</kbd> серия · <kbd class="kb">]</kbd>/<kbd class="kb">⌘2</kbd> оглавление<br><kbd class="kb">F</kbd> фокус · <kbd class="kb">⌘K</kbd> поиск',
  pinPanel: 'закрепить панель',
  focusEnter: '<kbd class="kb">F</kbd> выйти из фокуса',
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
  (typeof window !== 'undefined' && window.DEEPER_I18N) || {});
