# Журнал прогресса — impl/claude

Прогресс claude-реализации. Формат — по шаблону ниже. Новые записи
СВЕРХУ. (С фазы 02 каждый агент ведёт свой STATE в своей impl-папке;
общий `phases/STATE.md` — только каркас.)

Статусы фаз: `todo` → `in-progress` → `done`.

| Фаза | Статус |
|---|---|
| 01 Фундамент | done |
| 02 Статья | done |
| 03 Хром | todo |
| 04 Память I | todo |
| 05 Память II + планировщик | todo |
| 06 Идиоматичный | todo |
| 07 Разборы | todo |
| 08 Релиз | todo |

---

## Шаблон записи

```
## <дата> — фаза NN (<статус после сессии>)

Сделано:
- …

Проверено (приёмка): что прогнано, результаты.

Отклонения/находки:
- расхождения доков с реальностью, баги мока, вынужденные решения

Осталось (если фаза не закрыта): точный следующий шаг.
```

---

## 2026-07-03 — фаза 02 (done)

Hugo v0.154.5+extended (darwin/arm64, Homebrew). Рабочая папка —
`impl/claude/`.

Сделано:
- Render hooks (`themes/deeper/layouts/_markup/`): render-heading
  (id из `.Anchor`, хеш-якорь ПЕРЕД текстом, `##` для h3, aria через
  i18n), render-link (external target/rel; внутренние — GetPage по
  content-пути + linkcheck error/warn; mailto/tel/#), render-table
  (.tbl-wrap), render-image (lazy+size), render-codeblock —
  ОБЩИЙ, не per-lang: `go`→transform.Highlight (Chroma), всё
  остальное→`<pre><code class="nohl">`; подпись из fence-атрибута
  `{label=…}` → `<span class="code-label">`.
- Chroma: `20-chroma.css` руками (не gen-дамп) — маппинг классов
  Chroma на те же CSS-переменные, что и `.gtok-*` мока: .k/.kd/.kn/
  .kc→accent-amber, .kt→accent-blue, .nf/.nb→accent-green, .s*→gtok-str,
  .m*→accent-copper, .c*→text-muted+italic. `.chroma{background:
  transparent}` (даёт проступить `pre` мока), `.hl`→bg-surface,
  `.line{display:flex}`.
- Шорткоды (`_shortcodes/`): callout (4 типа, лейблы из i18n,
  переопределяются `label=`; .Inner как markdown block), widget
  (3 формы: `id` self-closed → пустой mount; `id`+.Inner → фолбэк
  внутри mount; без `id`+.Inner → сырой HTML прямо в figure),
  bigcard (internal href → RelPermalink), raw (passthrough .Inner|
  safeHTML). Рантайм `DG.widget(id,fn)` в main.js (~12 строк):
  DOM-ready, mount по id, try/catch-изоляция; запуск на
  DOMContentLoaded (page-bundle widgets.js — defer ПОСЛЕ main.js,
  регистрируется в промежутке parse→DCL).
- Шаблон+партиалы: page.html (грид .layout: rail-l/main.wrap/rail-r
  для статей рубрик; standalone-ветка для about/lab/roadmap),
  article/{kicker,meta,toc,rail-left,rail-right,series-bridge},
  series/pages (partialCached по терму) + article/series-ctx (дикт
  {isSeries,term,label,href,pos,total,pages}, общий на kicker/rail/
  bridge). h1 — сплит title по первому `": "` на main+`.sub`
  (override `sub:`, без двоеточия — одна строка). toc — только h2
  из .Fragments (спуск в синтетический узел; `plainify`; override
  `toc_labels` по id). series-bridge `.sbr` — серверный порт
  buildSeriesBridge (шкала flex-grow∝mins, легенда, next/prev).
- i18n (ru+en): part_of, mins_abbr, meta_*, callout_*, widget_cap,
  anchor_*, toc_heading, rail_*, series_word/all_series, sbr_* +
  parts_word (плюрал часть/части/частей).
- Порт memory-1: `content/internals/memory-1-layout/index.md`
  (front matter по SPEC §4 + intro/foot/arch/interactive/nav_title/
  toc_labels; проза конвертирована скриптом по кукбуку §3 — коллауты,
  6 виджетов, 6 mem + 2 byte-strip + scatter в `{{< raw >}}`, 5 Go
  fence, bigcard, hash-якоря, p.inline-explorer→`{.inline-explorer}`).
  widgets.js (46428 Б, silk-reorder) + widgets.css (7713 Б) —
  байт-в-байт скриптом.
- Стабы memory-2..7 (только front matter: title/slug/date/series/
  series_weight/nav_title/mins/tags/desc из ленты мока) — чтобы
  серия/кикер/мост memory-1 были верны СЕЙЧАС; полная проза — фазы
  04-05.
- Kitchen-sink `content/dev/kitchen-sink/` (draft) + widgets.js
  (DG.widget-счётчик): все шорткоды/коллауты/код(go/text/label/
  hl_lines)/таблица/mem/byte-strip/3 формы виджета/bigcard.

Проверено (приёмка):
- `hugo --gc --minify --printPathWarnings --printUnusedTemplates
  --printI18nWarnings` — 0 ошибок. 2 warning'а «unused template»:
  render-image (в контенте картинок нет вообще — inventory), render-
  table (в проде таблиц нет: у memory-1 их 0, единственная — в
  kitchen-sink, а он draft). Осознанные исключения (тема обязана
  уметь и то и то, ARCH §7).
- `build.publishResources=false` работает: в public/internals/
  memory-1-layout/ ТОЛЬКО index.html + собранные widgets.<hash>.js /
  widgets.min.<hash>.css; сырых widgets.js/.css НЕТ.
- prose-diff mock↔render — ПУСТО кроме санкционированных: §8.4
  мост (мок-статик `.series-nav` → серверный `.sbr`, 3 строки; текст
  моего .sbr совпал с рантайм-buildSeriesBridge мока) и §8.5 футер
  «rss soon»→«rss». Вся проза, виджеты, диаграммы, код — 1:1.
- id-diff заголовков — ИДЕНТИЧНЫ (s1..s10, s3-1/3-2/5-1).
- Компонентные счётчики = inventory: callout 3/2/2/1, figure.widget 6,
  w-root 5, mem 6, byte-strip 2, bigcard 1, Go-блоков 5, nohl 0.
- Битую ссылку добавил → сборка упала (render-link errorf) → убрал →
  чисто.
- Живьём (Chrome MCP, hugo :1313 vs мок :8437): верх memory-1
  пиксельно совпал; mem/byte-strip, drag-конструктор (silk-reorder)
  и w-padding работают; консоль чистая (только «SELFTEST PASS» —
  это лог мигрированного виджета, байт-в-байт как в моке). Цвета
  токенов Go совпали (type/struct — янтарь, int64 — синий). Kitchen-
  sink: все компоненты рендерятся, DG.widget-счётчик тикает 0→N.
- `node --check` на всех JS (модули+widgets) — OK.

Отклонения/находки (для доков):
- SPEC §6 неверно («заголовки однострочные»): у ВСЕХ статей h1 имеет
  `.sub` (сплит title по `": "`). У memory-1..7 title==h1 (сплит даёт
  тот же sub), у sched-1..4 sub в h1 ОТЛИЧАЕТСЯ от хвоста title —
  тем статьям (фазы 04-05) нужен явный `sub:`. Поддержан override.
- Мета-чип «интерактив» имеет вариативный лейбл (у memory-7 — «формат»)
  → front-matter `interactive_label`. В мете НЕТ чипа «часть N из M»
  (в phase §4 упомянут ошибочно) — он в кикере.
- `nav_title` (короткий заголовок рельса) — независимые данные
  (memory-5 «Green Tea GC», memory-6 «Memory Model» ≠ h1) → отдельное
  поле front matter, не выводится из title.
- Ярлык серии в кикере/рельсе — `lower .Title` хватает для «память»,
  но у «Идиоматичный Go в 2026» кикер мока «идиоматичный go» ≠
  lower(title) → терму нужен `params.label`. Поддержано (fallback на
  lower title).
- Вводный blockquote (только у memory-1) стоит МЕЖДУ meta и toc; т.к.
  toc серверный, вынес его в front-matter `intro:` (markdown), рендер
  до toc. Иначе prose-diff (упорядоченный) ловит перестановку.
- Встроенный `.toc` — ТОЛЬКО h2 (не h2+h3, как в phase §4 — это про
  rail-r). Мок РУКАМИ аббревиатурит 2 пункта toc (s3 «карта» vs h2
  «это карта»; s7 «аллокация» vs «почему он аллоцирует») — расхождение
  toc↔заголовок в самом моке. Генеримый из .Fragments toc берёт полный
  текст; добавил override `toc_labels` (id→строка), чтобы совпасть.
  Ещё: `.Fragments…Title` несёт inline-HTML (`<code>` в s8) — нужен
  `| plainify`.
- Мост: buildSeriesBridge НЕ переносится (нужен удалённый DG_INDEX) →
  `.sbr` серверный (phase §4). Мок статик держит `.series-nav`
  фолбэком, JS его заменяет; я рендерю сразу `.sbr` — отсюда
  единственное «текстовое» отличие prose-diff (санкц. §8.4). rail-r
  `#tocRail` и минимапы — пустые каркасы, достраивает перенесённый JS
  (как в моке): это держит prose-diff чистым (в статике мока их тоже нет).
- Конфиг: cascade `publishResources=false` с path-glob
  `/{internals,…}/**`+kind=page НЕ гасил утечку — заменил на просто
  `kind=page`, заработало. Рендер term-страниц: добавил cascade
  `kind=term` render/list never (как только у статей появились `tags`,
  Hugo варнил «no layout for term»; данные таксономии сохраняются,
  проверено — кикер/мост живы). `/series/**`-cascade убран (kind=term
  покрывает и серии, и теги; /series/ секцию гасит свой _index).
- Шорткод widget формы «только mount» ОБЯЗАН быть self-closed (`/>`) —
  шаблон трогает `.Inner`, иначе Hugo требует закрытия.
- Chroma не различает имена пользовательских типов и переменные (оба
  `.nx`) — сопоставил `.nx` с дефолтным цветом (переменных больше);
  встроенные типы (`.kt`) — синие. Косметика: `Point`/`Message` в
  Go-блоках не синие, в отличие от мока (переменные — верно).
- Мигрированный widgets.js на загрузке пишет один `console.log
  ('SELFTEST PASS …')` — это код мока (кукбук §5, байт-в-байт), не
  трогаю; в моке то же.

Осталось соседним фазам (не блокеры memory-1):
- Якорь `/internals/#memory` (rail/мост/кикер ведут на него) —
  check-links даёт 22 ссылки на него: секции серий на странице рубрики
  = фаза 03. Ссылки корректны, цель появится там же.
- Полная проза memory-2..7 (сейчас стабы) — фазы 04-05.
- Серверы оставил: hugo `impl/claude` на :1313 (с -D), мок на :8437 —
  для живой сверки.

---

## 2026-07-03 — фаза 01 (done)

Hugo v0.154.5+extended (darwin/arm64, Homebrew). Рабочая папка —
`impl/claude/` (свой git-репозиторий внутри).

Сделано:
- Каркас: `impl/claude/` — сайт в корне, тема в `themes/deeper/`,
  свой git-репо. .gitignore (public/, resources/_gen/, .hugo_build.lock).
- hugo.toml сайта: [languages.ru], таксономии tag/series, goldmark
  unsafe + typographer disable, highlight noClasses=false, [params]
  по SPEC §10, [[menus.main]] (4 пункта, Лаборатория badge="β"),
  cascade build never для /series/**, cascade publishResources=false
  для kind=page рубрик.
- Тема: hugo.toml ([module.hugoVersion] min 0.146, extended не указан),
  theme.toml, LICENSE (MIT), README-заглушка.
- CSS: site.css нарезан по границам блоков на 00-tokens..18-scrolltop
  + 20-chroma (пустой), порядок правил сохранён. 00-tokens — только
  нецветовые токены. 7 палитр — data/themes/*.toml (ramp+strong+
  gtok-str+акценты; light несёт body-glow=none). head/palettes.html
  генерирует :root(дефолт)+[data-theme] блоки первыми в бандл;
  head/palettes-json.html — <script id=dg-themes> для пикера.
  head/css.html: палитры→numbered css/[0-9]*→custom.css→widgets.css;
  prod minify+fingerprint. Сырые css/js/шрифты-исходники в public не
  утекают.
- Шрифты: скачаны self-host woff2 (Inter+JBM, latin+cyrillic,
  400/500/600/700 = 16 файлов) + OFL.txt. head/fonts.html:
  @font-face с unicode-range + preload двух latin-400; блок условный
  (нет файлов → системные фолбэки).
- JS: prefs.js (инлайн pre-paint: data-theme/классы рельс/rubvar).
  main.js (js.Build iife, defer) + modules/ (store, i18n, view,
  popover, header, minimap, toc, rails, focus, visited, tooltip, keys,
  search, scrolltop). Тема применяется сменой data-theme (не var-swap).
  НЕ перенесены: regex-подсветчик Go, plural(), buildSeriesBridge(),
  DG_INDEX. search.js — наша модалка + Pagefind lazy-import, до фазы 03
  показывает тихую подсказку. I18N в modules/i18n.js
  (window.DEEPER_I18N). DG.widget-рантайм отложен на фазу 02 (архетип
  на него ссылается — контракт ARCH §4a).
- Шаблоны: baseof (body-класс article/rubric по kind+section, без
  cascade-параметра — тема generic), head + head/{meta,prefs,palettes,
  palettes-json,fonts,css,og-заглушка}, header (logo-партиал, nav .on
  через IsMenuCurrent/HasMenuCurrent, sup.beta по menu param badge),
  footer (ссылки из GetPage+i18n, live rss→/index.xml), scripts,
  hooks/{head,foot}-extra (пустые override-точки), home (hero-line),
  page/section/taxonomy заглушки, 404 начисто. Все UI-строки — i18n.
- i18n: ru.toml + en.toml (nav/search/footer-labels/404 + плюралы
  minutes/guides_left/parts_count/part_of).
- Контент: _index.md (hero в params), 3 рубрики _index (label/
  slug_mono/sub/lead/foot дословно), series/_index (build never) +
  memory/sched/idiomatic термины (title/description/weight/tagline),
  about/roadmap/lab заглушки, data/roadmap.toml (пример).
- Архетипы: default.md + guides/(index.md + widgets.js на DG.widget).

Проверено (приёмка):
- `hugo --gc --minify --printPathWarnings --printUnusedTemplates
  --printI18nWarnings --logLevel info` — 0 ошибок, 0 warning'ов
  (term.html удалён; taxonomy.html-заглушка закрывает /tags/).
- `tools/check-links.py public/` — OK: 9 pages, все ссылки/якоря.
- `node --check --input-type=module` на всех JS — OK.
- CSS bundle 58KB min (<70), main.js fingerprinted. Индивидуальные
  файлы в public/ не публикуются.
- Палитры: :root(amber)+7 [data-theme] блоков; значения сверены с
  таблицей мока (nord --border #404857, light body-glow:none, акценты).
- Шапка/футер: HTML совпадает с моком (nav .on на internals, β у
  Лаборатории; футер в каноническом порядке, rss→/index.xml).
- Титулы: home «deeper.go — гайды…», рубрики «X — deeper.go».
- dg-themes JSON: сырой массив (safeJS), не двойно-кодирован.
- Живая визуальная проверка в браузере НЕ выполнена (в ту сессию MCP
  Chrome не был подключён; в фазе 02 сверено — совпадает).

Отклонения/находки (для доков):
- TOML: скалярные [params] ДОЛЖНЫ идти до [params.subtable] — иначе
  поглощаются предыдущей подтаблицей (heroLine ушёл в brand). Баг
  найден и исправлен.
- jsonify в <script> нужен | safeJS (не safeHTML): иначе Go
  оборачивает JSON в строку с экранированием.
- resources.Match для css публикует индивидуальные файлы — не критично
  здесь (glob по css/[0-9]* + Concat, отдельные не линкуются).
- theme-light класс мока заменён на data-driven var --body-glow
  (light-палитра ставит none) — санкционировано (палитры = данные).
- Акценты вложены в каждый файл палитры (per-palette override), а не
  общим блоком — 00-tokens остаётся строго нецветовым (ARCH §5).
- term.html удалён ради нулевых warning'ов (термины не рендерятся —
  так и по спеке: чипы ведут на /tags/#tag). Полные теги — фаза 03.
- Осиротевшее правило .vkey мока (бейдж F2 удалён из production) в
  тему не переносится.

Заготовлено, но пока не задействовано (ждёт статей/след. фаз):
- minimap peek/rail-pin, tooltip, focus, visited, scrolltop — код
  есть, оживёт на статьях (фаза 02: задействовано на memory-1).
- chroma.css (пустой), head/og.html (заглушка) — фазы 02/03 (chroma
  заполнен в 02).
- Pagefind lazy-load в search.js — индекс появится в фазе 03.
- i18n-плюралы — используются с фазы 03.
