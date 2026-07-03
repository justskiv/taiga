# Журнал прогресса — impl/claude

Прогресс claude-реализации. Формат — по шаблону ниже. Новые записи
СВЕРХУ. (С фазы 02 каждый агент ведёт свой STATE в своей impl-папке;
общий `phases/STATE.md` — только каркас.)

Статусы фаз: `todo` → `in-progress` → `done`.

| Фаза | Статус |
|---|---|
| 01 Фундамент | done |
| 02 Статья | done |
| 2.5 Агностичность | done |
| 03 Хром | done |
| 04 Демо (exampleSite) | todo |
| 05 Релиз | todo |

(Таблица приведена к текущему PLAN.md: контент-фазы конверсии статей
мока отложены в `phases/archive/`; после 03 идут 04 Демо и 05 Релиз.)

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

## 2026-07-04 — мерж-консолидация (перед фазой 04)

Конкурс завершён: моя реализация — база; фазы 04-05 веду один, Кодекс —
независимый ревьюер. Перед 04 велено перенять несколько судейских
решений у конкурентов (impl/codex, impl/glm — открыты read-only ради
этого) и починить 3 находки аудита. Чужой код — источник идей и
ДАННЫХ, не для копирования; реализация — в своей архитектуре.

ДЕЛЬТА СПЕКИ (получена в чате, затем доехала синком в 10-SPEC.md §4):
раздел «Заглушки» — `placeholder: true` САНКЦИОНИРОВАН и желателен для
несконвертированных статей мока; полный front matter из ленты мока,
тело — одна строка «Страница временно содержит только метаданные»;
ВКЛЮЧАЮТСЯ в ленту/облако/серии, ИСКЛЮЧАЮТСЯ из RSS и поиска. Плюс
канон-поле `rail_title` (короткое имя 2-4 слова для левой панели/
минимапы; фолбэк — title). В МОЁЙ копии пакета §4 «Заглушки» сперва
не было (пакет не доехал) — работал по нормативному тексту из чата,
затем сверил с досинченным §4: совпало.

ПЕРЕНЯТО:
- [#1 заглушки в хроме] Источник идеи — SPEC §4-дельта; ДОНОР ДАННЫХ —
  front matter Кодекса (impl/codex/content/**, placeholder:true), но
  значения СВЕРЕНЫ С ЛЕНТОЙ МОКА (index.html) и взяты оттуда: у Кодекса
  description = текст рубричного `.a-s` (короче), а для prose-diff
  главной нужен текст ленты `.p-s` — использовал мок. Создал 10
  заглушек (sched-1..4, idiomatic-1/2, graceful-shutdown, func-options,
  url-shortener, grpc-auth) в своей YAML-схеме; 6 memory-стабов ф.02
  привёл к канону (`stub`→`placeholder`, `nav_title`→`rail_title`, убрал
  lead/draft, тело — одна строка). Логика: `guides.html` теперь ВКЛЮЧАЕТ
  все регуляры рубрик (заглушки в ленте/облаке/сериях); новый
  `guides-published.html` (минус placeholder) — для RSS; `page.html`
  не отдаёт placeholder в `data-pagefind-body`. Результат = мок:
  лента 17 + «ещё 9 гайдов», карточки 11/4/2, облако 29 тегов·17
  гайдов (#gc ×2), серии 7·~1,5 ч / 4·~50 мин / 2·~1 ч.
- [#3 нейтральный неймспейс] Источник — GLM (core.js). `window.
  DEEPER_I18N` → `window.THEME_I18N` (в имени не должно быть бренда
  сайта). Только i18n.js (2 вхождения), больше нигде.
- [rail_title] Источник — SPEC §4-дельта (Кодекс тоже использует). Мигрировал
  `nav_title`→`rail_title` в контенте memory-1..7 и шаблонах rail-left/
  series-bridge (фолбэк на split(title,":")[0] сохранён).

ОЦЕНЕНО И ОСТАВЛЕНО СВОЁ (обоснование — по правилу «если твой не хуже»):
- [#2 render-codeblock, GLM: text-лексер для fence без языка]. ЦЕЛЬ —
  визуальный паритет с `.nohl` мока. У меня не-Go/bare/`text` уже даёт
  ТОЧНУЮ разметку мока `<pre><code class="nohl">` (проверено на
  kitchen-sink) — это и есть класс мока, а не «визуально похоже».
  Подход GLM (`transform.Highlight … "text"` для всего) даёт `.chroma`
  (др. разметка) И красит НЕ-Go языки (`or .Type "text"`: ```python
  → python-лексер → токены → chroma.css их подсветит) — отступление от
  SPEC §8.2 «сервером только Go». Мой — вернее и по §8.2, и по разметке
  мока. Оставил свой (структурно чужое не тащим — «железно своё»).
- [#4 партиал шрифтов, GLM]. Оба: existence-gated @font-face, раздельные
  unicode-range latin/cyrillic, preload двух. Мой DRY-ер (циклы по
  семьям/сабсетам/весам vs дублирующиеся Inter/JBM-блоки GLM) И
  фингерпринтит URL шрифтов в prod (GLM — нет). Плюс GLM — @font-face
  в бандл через Scratch (у меня инлайн `<style>`), но это не перевешивает
  DRY+fingerprint. Оставил свой.

ПОЧИНЕНО СВОЁ (аудит ф.03):
- [#5 empty-state рубрик] «0 разборов» у пустой рубрики → карточка без
  контента показывает муут `готовится` (i18n rubric_empty), счётчик
  только при `nGuides>0`. После #1 случай не встречается (все рубрики
  с заглушками), но обработка корректна.
- [#6 OG-обложка] кикер дублировал тайтл (DEEPER.GO/deeper.go). Теперь
  различаю по Kind: home → тайтл=слоган (heroLine), без кикера; section
  (рубрика) → кикер «рубрика» + тайтл рубрики; service/taxonomy (about/
  roadmap/lab/tags) → свой `kicker` + editorial `headline` (напр.
  «о проекте» + «Не блог.»). NB: первый заход клал «рубрика» ВСЕМ не-home
  не-guide (about/tags получали «РУБРИКА») — поймано кросс-ревью, чиню
  веткой `eq .Kind "section"`. Осмотрел home/рубрику/about — чисто.
- [#7 OG-шрифт заголовка] был Inter 700 (merge woff2 темы). Скачал
  настоящие сабсеты Inter 800 (fontsource) latin+cyrillic, смёржил →
  Inter-ExtraBold.ttf, usWeightClass=800, покрытие полное.
- Побочно (всплыло на ленте из 17 постов, было латентно при 1 посте):
  date-ru «май»→«мая» (родительный, как в ленте мока «30 мая»); серии
  idiomatic добавлен `params.label: "идиоматичный go"` (кикер мока без
  «в 2026»); ослаблены whitespace-`{{- -}}` в карточках/featured/wip
  (блочные/flex-элементы, визуально ноль) — чтобы prose-diff главной
  сошёлся с моком.

ОТКЛОНЕНО (осознанно НЕ перенято):
- Кодекс `data/series.toml` (метаданные серий в data-файле) — его
  отклонение; держу метаданные во front matter терминов `content/
  series/*/_index.md`, как по SPEC §4. Взял у Кодекса только ДАННЫЕ
  (значения front matter заглушек), не структуру.
- Тензия по имени callout-класса `internals` — решения владельца нет,
  НЕ переименовывал (как велено).

Проверено (приёмка) — СЫРОЙ вывод:
- Сборка `hugo --gc --minify --printPathWarnings --printUnusedTemplates
  --printI18nWarnings`: 0 ошибок, 2 «unused» (render-image, home/logos/
  default — прежние санкц. исключения).
- `check-links.py public/` → «OK: 26 pages, all internal links and
  anchors resolve» (было 16; +10 заглушек).
- Счётчики: лента 17 `<article class=post>` + кнопка «ещё 9 гайдов»;
  карточки «11 гайдов · 2 серии | 4 гайда · 1 серия | 2 разбора»;
  облако «29 тегов · 17 гайдов», 29 чипов (#gc ×2); серии internals
  «7 частей · ~1,5 часа | 4 части · ~50 мин».
- `pagefind --site public` → «Indexed 4 pages» (memory-1 + about/
  roadmap/lab; заглушки вне индекса). RSS `index.xml` → 1 item
  (memory-1; заглушки вне фида).
- prose-diff главной (не-мин. сборка) → ТОЛЬКО санкционированное:
  featured `.f-s` (§9 единый источник — беру `.Description`, у мока там
  рукописный лид-вариант) + `rss soon`→`rss` (§8.5). Лента 17, карточки,
  кикер, wip — совпали. /tags/: мок-статик несёт пустое облако (JS
  строит в рантайме) — моё server-render облако/лента «добавлены»
  (§8.4); контент (29 тегов, #gc ×2, 17 гайдов) сверен с рантаймом мока.
- Глазами (обложки OG home/рубрика — чисто, Inter 800 тяжелее);
  живьём фичи не перепроверял (изменения #1 — контент; хром-механики
  ф.03 уже проверены живьём, здесь не трогались).
- `node --check` i18n.js — OK.

Кросс-ревью (независимый ревьюер, на коммите консолидации) — 2 major,
принял оба, поправил тем же коммитом (amend, история не запушена):
- OG-кикер «рубрика» протекал на все не-home не-guide (about/roadmap/
  lab/tags получали «РУБРИКА» на обложке). Починка — ветка `eq .Kind
  "section"` (см. #6 выше); service/tax берут свой kicker+headline.
- Сообщение коммита нарушало правила: в теле были имена агентов-
  источников (в моих коммит-правилах и 00-AGENT §2 — нельзя в
  коммитах) и строки >72. Переписал тело обобщённо, без имён, ≤72;
  subject — в принятом в проекте формате `[тег] type:` (AGENTS.md в
  репо нет; правило проекта — CLAUDE.md — тег в скобках допускает).
  Источники перенятий остаются в STATE (это внутренний журнал, и
  пользователь снял ограничение специально для консолидации).
- Негейтящий шум ревью (комменты «published/stubs don't count» в
  taxonomy/feed/rss, устаревшие после включения заглушек в хром) —
  поправил формулировки под новую модель.

---

## 2026-07-03 — фаза 03 «Хром» (done)

Весь хром сайта: главная, рубрики, теги, поиск, RSS, OG/SEO, доп-
страницы. Рабочая папка — `impl/claude/`.

Сделано:
- ГЛАВНАЯ (`home.html` + `_partials/home/*`): hero из params;
  `rubric-cards` — карточки по `rubricSections` (generic, не «3»),
  логотип секции через lookup `home/logos/<section>.html` (сайт) с
  фолбэком `home/logos/default.html` (тема, нейтральный глиф на
  currentColor); ТРИ SVG-мока — партиалы САЙТА `impl/claude/layouts/
  _partials/home/logos/`; `.r-n` = «N гайдов · M серий» / «N разборов»
  (плюралы i18n, счёт по секции). `featured` — карточка «гайд недели»
  (generic) + байт-виджет: чтобы тема осталась агностична, сам виджет
  = generic-модуль `featured.js` (читает JSON-остров `#hd-data`), а
  Go-данные (layouts Message) + скелет — партиал САЙТА `home/featured-
  demo.html` (см. находку про §6). `feed` — опубликованные гайды по
  дате, первые `feedInitial` видимы, хвост в `.feed-more` +
  `reveal.js`. `wip` — незавершённые (ready≠true) `data/roadmap.items`,
  первая буква title в нижний регистр. Общие партиалы: `post.html`
  (одна `.post`, серия через `series-ctx`, `data-tags` для фильтра),
  `date-ru.html` («27 июн», с годом для не-текущего), `guides.html`
  (опубликованные гайды = регуляры рубрик минус стабы).
- РУБРИКИ (`section.html` + `_partials/rubric/*`): кикер «рубрика ·
  slug_mono», h1+`.sub`, lead; `series-block` — по терминам series
  секции (порядок = weight термина; термины берём через `.GetTerms`
  на страницах секции, т.к. `site.GetPage /series/..` для render:never
  термов даёт nil), «N частей · ~X ч» через `duration.html` (≥60 мин →
  часы с округлением до 0.5 «~1,5 часа»; <60 → «~N мин»); `alist` —
  стендэлоны с условным заголовком «разборы вне серий». «Дальше» и
  «Формат живой» коллауты добавлены в тела `_index.md`.
- ТЕГИ (`taxonomy.html` + `content/tags/_index.md`): облако моно-чипов
  со счётчиками ИЗ опубликованных гайдов (частота, ничьи — алфавит),
  «облако · N тегов · M гайдов»; полная лента постов (server-render)
  + `tags-filter.js` (hash-фильтр, сброс повторным кликом/ссылкой,
  пустое состояние). Стили чипов → `19-tags.css` (тема-компонент).
  Термины `/tags/<tag>/` не рендерятся (каскад ф.01, проверено).
- ПОИСК (Pagefind): `data-pagefind-body` на теле статьи (стабы —
  без него, вне индекса), meta `title` (h1) + `crumb`/`mins` (пустые
  инлайн-спаны), код-блоки `data-pagefind-weight="0.5"` (render-
  codeblock); `search.js` доведён (крошка+минуты+выдержка, `<mark>`→
  янтарь `.sm-item .d mark`). Pagefind 1.5.2 (пин), сборка = `hugo &&
  pagefind --site public` (README сайта).
- RSS (`rss.xml`): опубликованные гайды, полнотекст (`content:encoded`),
  лимит `[services.rss]`; `[outputs]` — RSS только у home (секции/
  таксономии/термы без index.xml); автодискавери-`<link>` в head.
- OG/SEO (`head/og.html` + `og-image.html` + `assets/og/dots/`):
  полный контракт og/twitter/article + JSON-LD (TechArticle +
  BreadcrumbList на гайдах, WebSite на главной, `jsonify | safeJS`);
  генерация обложек стиля «dots» — `layout.toml` (transform.Unmarshal)
  рисует блоки {kicker}{title}{meta}{domain} через images.Text поверх
  `base.png`; правый мета-блок right-align вручную (моно: сдвиг x на
  RuneCount·size·0.6). Оверрайды: `og.png` в бандле, `og_image`,
  `ogImages.enable`. TTF в `assets/og/fonts/` + OFL.
- ДОП-СТРАНИЦЫ: `about.md` (проза, таблица хоткеев, коллаут, фраза RSS
  → «уже работают» /index.xml); `roadmap.md` + шорткод `{{< roadmap >}}`
  (рендерит now/queue/rules из `roadmap.toml`, h2 с хеш-якорями как
  render-heading, inline-markdown в note/queue/rules) + полный
  `roadmap.toml`; `lab/index.md` (widget-скелет + `content/lab/
  widgets.js` тренажёр). `page.html` standalone-ветка: kicker/headline/
  sub/foot из front matter + `data-pagefind-body`.
- МЕЛОЧИ: `robots.txt` (allow all + Sitemap), sitemap дефолтный (15
  URL, без термов); `stub: true` на memory-2..7.

Проверено (приёмка) — СЫРОЙ вывод:
- Сборка `hugo --gc --minify --printPathWarnings --printUnusedTemplates
  --printI18nWarnings`: 0 ошибок, 0 i18n/path-warning; 2 «unused
  template» — `render-image` (в контенте картинок нет) и `home/logos/
  default.html` (все 3 рубрики имеют свои лого сайта, фолбэк не
  вызывается). Обе — осознанные (тема обязана уметь и то и другое).
- `check-links.py public/` → «OK: 16 pages, all internal links and
  anchors resolve».
- `pagefind --site public` → «Indexed 4 pages» (memory-1, about,
  roadmap, lab; главная и стабы — вне индекса, как задумано).
- `xmllint --noout public/index.xml` → VALID; 1 item (memory-1),
  полнотекст.
- prose-diff (visible-text) против мока — только санкционированное:
  about — RSS-фраза + `rss soon`→`rss` (§8.5); roadmap — то же + порядок
  футер-ссылок (§8.15, баг мока не воспроизводим); lab — `rss` (§8.5);
  internals — отсутствует серия «Планировщик» (нет контента sched —
  реальность ф.03), memory-серия БАЙТ-в-байт как мок; memory-1 —
  прежние §8.4 (мост `.sbr`) + §8.5, т.е. правки ф.03 (pagefind-обёртка,
  meta-спаны, code-weight, `<p>` в коллауте) текст НЕ изменили.
- Живьём (Chrome, прод-сборка + pagefind на :1319): ⌘K нашёл memory-1
  по слову ИЗ ТЕКСТА «выравнивании» → совпало «выравниванию» (русский
  стемминг!), карточка = крошка «под капотом · память · часть 1 из 7»
  + «14 мин» + выдержка с ЯНТАРНЫМ `<mark>`; теги — клик #layout даёт
  «лента · #layout · 1 гайд» + сброс, повторный клик/ссылка сброс,
  неизвестный тег → пустое состояние; тренажёр лаборатории — bool·
  int64·bool = 24 Б/14 pad, «оптимизировать» → 16 Б/6 pad, «очистить»
  → 0; featured байт-виджет отрисовал naive-раскладку (24 Б);
  rubvar rows/loud = block, shelf = grid 2×350px. Консоль — 0 ошибок.
- `node --check` (stdin, module) на всех JS + `content/lab/widgets.js` —
  OK; JSON-остров `#hd-data` валиден.

Отклонения/находки (для доков пакета):
- РЕШЕНИЕ про стабы: `stub: true` на memory-2..7. Стаб = часть серии
  для СТРУКТУРЫ (входит в рельс/мост/кикер статьи, в `series-block` и
  счётчик карточки рубрики → «7 гайдов», серия «7 частей · ~1,5 часа»
  как в моке), но НЕ «готовый гайд»: `guides.html` его исключает, и он
  выпадает из ленты главной, тегов, RSS и Pagefind. Так «лента живёт с
  одной статьёй» (приёмка §6: 1 гайд) при верной структуре серии.
  Стабы ОСТАЮТСЯ в sitemap (валидные URL, достижимы по ссылкам серии)
  — консистентно: sitemap = всё достижимое, поиск/лента = готовое.
- АГНОСТИЧНОСТЬ vs phase §1 «featured.js в теме»: скелет+данные
  featured — Go-специфичны (Message, unsafe.Sizeof), класть их в тему
  = регресс ф.2.5. Разрешил как lab (§10a): generic-механизм в теме
  (`featured.js` читает `#hd-data`), Go-контент — партиал САЙТА
  `home/featured-demo.html`. Тема осталась предметно-чистой. Отступление
  от буквы phase §1, но по духу §1+§10a. (То же для тренажёра лабы.)
- НАЙДЕНЫ И ПОЧИНЕНЫ (правки тем-файлов ф.02, обе текст-нейтральны для
  memory-1): (1) render-link на `/index.xml` падал (GetPage не находит
  output-URL) — добавил ветку «ссылка с расширением (.xml/.png/…) →
  passthrough без GetPage»; нужно для about-ссылки на RSS (SPEC §8.5).
  (2) коллаут-шорткод рендерил `.Inner` инлайн (без `<p>`), мок — с
  `<p>`; переключил на `RenderString display:block`. Оба — реальные
  баги, всплывшие на хроме ф.03.
- КАРТОЧКИ РУБРИК главной: `.r-n` считает ВСЕ регуляры секции (со
  стабами) — зеркалит `series-block` страницы рубрики, куда ведёт
  карточка (7=7). Пустые рубрики (bp/practice без контента) → «0
  разборов» (ветка без серий); косметика пустого состояния, уйдёт с
  контентом. Лента главной при этом = 1 (метрика «свежих постов» ≠
  «библиотека», как в моке card 11 vs feed 17).
- WIP-полоса: мок болдит только «планировщик:» во втором пункте, я
  болжу пункт целиком (данные единообразно). ВИДИМЫЙ текст совпал
  (prose-diff чист), отличие только в объёме `<b>`.
- OG-ШРИФТЫ: JBM SemiBold/Medium — полные TTF с GitHub (кириллица
  есть); Inter-ExtraBold собрал из woff2 темы (merge latin+cyrillic
  700 через fontTools — вес 700 вместо 800, для заголовка обложки
  достаточно). fonttools/pagefind ставил в venv (PEP 668 на brew-
  python; venv в scratchpad, не в проекте). Проверил обложки глазами:
  memory-1 и home — кириллица целая, перенос заголовка чистый, бренд/
  мета на месте.
- OG-СТИЛЬ: сделан ОБЯЗАТЕЛЬНЫЙ «dots». Остальные стили (rail/bytestrip/
  terminal/spread) и `home.png` — НЕ делал (остаточный бюджет, phase
  помечает желательными): механика от одного стиля не зависит, добавить
  папкой без правок кода. Home/рубрики берут общий пайплайн из base.png
  (кикер=site.Title, title=page.Title — для home чуть тавтологично
  «DEEPER.GO»/«deeper.go», уйдёт если завести `home.png`).
- SPEC §6 «featured .f-s» ≠ мок дословно: беру `.Description` (единый
  источник §9), у мока там рукописный вариант лида. Не воспроизводимо
  без спец-поля; расхождение на главной (и так разъехавшейся по контенту).
- Инфра: `pagefind`/`fonttools` в venv scratchpad — dev-инструменты,
  сайт от них не зависит (README пинует 1.5.2). Живой сервер поднимал
  на :1319 (:1313/:1314 были заняты — на :1314 крутился чужой блог
  Тузова, тоже на pagefind; чуть не сверил не тот сайт).

Осталось соседним фазам:
- Реальные статьи рубрик (memory-2..7 полная проза, sched, idiomatic,
  practice) — пользователь пишет позже; тогда лента/теги/поиск/счётчики
  наполнятся сами, пустые карточки рубрик оживут.
- exampleSite (ф.04) из `demo-content/`; доки темы, CHANGELOG, CI (ф.05).
- OG: доп-стили обложек + `home.png` (некритично).

---

## 2026-07-03 — фаза 2.5 (done)

Корректирующая мини-фаза: тема-агностичность + переименование поля
версии. Рабочая папка — `impl/claude/`.

Сделано:
- Задача 1 (переименование чипа версии): `go_version` → `version`
  (теперь произвольная СТРОКА ЦЕЛИКОМ), `goVersionDefault` →
  `versionDefault = "go1.26"`. `article/meta.html` выводит строку как
  есть — убран захардкоженный префикс `go` (`<b>go{{$ver}}</b>` →
  `<b>{{$ver}}</b>`; при значении `go1.26` вывод тот же). Переименовано
  в: hugo.toml (params + коммент), meta.html (логика + коммент),
  archetypes/guides/index.md (+ коммент про free-form), контент
  memory-1..7 (значение → `go1.26`). kitchen-sink поля версии НЕ имеет
  — переименовывать нечего (чип рендерится только на статьях рубрик).
- Задача 2 (агностичность): захардкоженный список рубрик вынесен из
  разметки темы в конфиг сайта — `params.rubricSections =
  ["internals","best-practices","practice"]`. `baseof.html` (класс
  body «article»), `page.html` ($isArticle), `404.html` (список
  рубрик) читают его. Футер: строка ссылок → меню сайта
  `[[menus.footer]]` (5 пунктов), `footer.html` итерирует
  `site.Menus.footer`; удалены секционные i18n-ключи foot_internals/
  foot_bestpractices/foot_practice/foot_roadmap/foot_about (foot_rss
  оставлен — фид генеричен). Генерик-правки комментариев: page/
  series-ctx (примеры «/internals/#memory» → «/<section>/#<series>»),
  header + css/js-заголовки («deeper.go» → «deeper», т.е. имя темы,
  без бренд-TLD).

Проверено (приёмка):
- `hugo --gc --minify --printPathWarnings --printUnusedTemplates
  --printI18nWarnings` — 0 ошибок, только 2 известных «unused
  template» (render-image/render-table — санкц. в фазе 02). Новых
  i18n-warning нет (удалённые ключи в темплейтах больше не
  упоминаются).
- ПАРИТЕТ вывода: снял baseline до правок. Страницы рубрик/статей —
  `diff` ПУСТ (public/internals/memory-1-layout, best-practices):
  мои правки байт-в-байт нейтральны, паритет с моком (ф.02) держится;
  чип версии = «go1.26» (grep `проверено на <b>go1.26</b>`). home и
  404 сперва отличались от baseline флипом active-класса «Лаборатория»
  — предсуществующий недетерминизм кэша шапки (НЕ следствие правок
  2.5). ПОСЛЕ фикса кэша (см. находку ниже) все четыре — home, 404,
  memory-1, best-practices — БАЙТ-В-БАЙТ идентичны baseline,
  детерминированно.
- `grep go_version|goVersionDefault` вне public/ — ПУСТО.
- Повтор аудит-грепа фазы (go1|golang|internals|best-practices|
  practice|deeper по layouts/assets/i18n) — остались только
  обоснованные (список ниже).
- `node --check` (module) main.js/prefs.js/i18n.js — OK.
- check-links: 22 предсуществующих `/internals/#memory` (цель — фаза
  03), счётчик не изменился, новых битых нет.

Обоснованные вхождения аудита (п.2, оставлены осознанно):
- Вариант коллаута `internals` (shortcode-тип + `.callout.internals`
  CSS + i18n `callout_internals`) — это КЛАСС ИЗ МОКА (DESIGN.md:
  `callout internals` → «Под капотом»), а не ссылка на рубрику.
  Переименование = несанкц. отличие от мока (правило §8) + ломает
  prose-diff memory-1 (класс в HTML). ⚠ ТЕНЗИЯ с принципом 2.5: имя
  совпадает с рубрикой. Разрешить я не могу (мок — read-only); если
  нужна полная агностичность — переименовать вариант согласованно
  в моке+теме и внести в §8. Вопрос владельцу спеки.
- `window.DEEPER_I18N` (modules/i18n.js) — namespace i18n-оверрайдов
  темы (по имени темы, документирован в customizing.md). Не
  тематическая привязка. Оставлен.
- Заголовки `deeper` (00-tokens/18-scrolltop/main.js/prefs.js) —
  теперь имя ТЕМЫ (бренд-TLD «.go» убран). Допустимо (имя темы).
- `meta.html` коммент «go1.26»/«PostgreSQL 17» — иллюстрация
  free-form поля (демонстрирует агностичность). Оставлен.

Отклонения/находки (для доков пакета):
- ⚠ НАЙДЕН И ПОЧИНЕН БАГ (предсуществующий, с ф.01; по команде
  пользователя починил сразу, отдельным коммитом): активный пункт
  навигации на страницах БЕЗ секции был недетерминирован.
  `baseof.html` кэшировал шапку `partialCached "header.html" .
  .Section`; home, 404 и /lab имеют `.Section == ""` и делили ОДИН
  кэш — кто отрендерится первым (конкурентно, случайно), тот задавал
  active-состояние всем троим: /lab первым → «Лаборатория» class=on
  протекала на home и 404; home первым → /lab ТЕРЯЛ свой active.
  Проверено 4 пересборки ДО: флипало (build 1-3 off, 4 on), троица
  всегда согласована — коллизия по ключу "". ФИКС: ключ кэша →
  `(or .Section .RelPermalink)` — секции делят кэш как раньше (паритет
  статей держится), бессекционные страницы кэшируются поштучно.
  Проверено 5 пересборок ПОСЛЕ: home/404 стабильно без active, /lab
  стабильно со своим active (раньше терял), статья — internals active;
  всё детерминировано, home/404/memory-1/best-practices = baseline
  байт-в-байт.
- Механизм «какие секции — рубрики» вынесен в конфиг
  (`params.rubricSections`). Будущим фазам (03: карточки рубрик
  главной) переиспользовать его, а не хардкодить «3 штуки» —
  согласуется с примечанием фазы 2.5.
- Логотипы/карточки рубрик главной пока не тронуты (home.html —
  стаб hero-line): это фаза 03 (партиалы сайта `home/logos/…` +
  фолбэк), принцип учтён на будущее.

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
