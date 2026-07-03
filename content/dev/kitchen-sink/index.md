---
title: "Kitchen sink: все компоненты темы"
slug: kitchen-sink
date: 2026-07-03
draft: true
description: "Регресс-полигон: все шорткоды, коллауты, код, диаграммы и виджеты на одной странице."
lead: "Черновая страница (`draft: true`) — видна только в `hugo server -D`, в прод не попадает. Держит по одному экземпляру каждого компонента, чтобы правки дизайна было на чём проверять."
---

## Заголовки и якоря {#headings}

Второго уровня — с решёткой `#`, третьего — с `##`. Инлайн: *курсив*, **жирный**,
`код`, внутренняя ссылка на [эталонную статью](/internals/memory-1-layout/).

### Подзаголовок третьего уровня {#sub}

Проверяем, что render-heading вешает `##` и якорь на h3.

## Код {#code}

Go подсвечивается сервером (Chroma в цветах палитры):

```go
type Point struct {
	X, Y int64
}
func dist(a, b Point) int64 { return (a.X-b.X)*(a.X-b.X) }
```

С подписью файла и подсветкой строки (`{label=… hl_lines=[2]}`):

```go {label="runtime/malloc.go (упрощено)" hl_lines=[2]}
func mallocgc(size uintptr) unsafe.Pointer {
	c := getMCache()          // горячий путь — без блокировок
	return c.alloc(size)
}
```

Не-Go — плоский `.nohl` (fence `text` или без языка):

```text
$ go build ./...
ok  deeper/internals  0.312s
```

## Таблица {#table}

Markdown-таблица, обёртку `.tbl-wrap` вешает render-table:

| Тип      | Размер | Выравнивание |
|----------|-------:|:------------:|
| `bool`   |      1 |      1       |
| `int64`  |      8 |      8       |
| `[]T`    |     24 |      8       |

## Коллауты {#callouts}

{{< callout type="key" >}}
Главная мысль с дефолтным лейблом. Внутри — **markdown** и `код`.
{{< /callout >}}

{{< callout type="trap" >}}
Ловушка с дефолтным лейблом.
{{< /callout >}}

{{< callout type="internals" label="Под капотом: свой лейбл" >}}
Коллаут «под капотом» с переопределённым лейблом.
{{< /callout >}}

{{< callout type="note" >}}
Историческая сноска — самый тихий тип.
{{< /callout >}}

## Диаграммы {#diagrams}

Диаграмма памяти и байтовая лента — сырой HTML через `{{</* raw */>}}`:

{{< raw >}}
<div class="mem">
  <div class="mem-lab"><code>Point{X, Y int64}</code> <span class="tot">→ 16 байт, ноль воздуха</span></div>
  <div class="byte-strip" aria-hidden="true">
    <div class="byte-seg"><div class="cells"><div class="byte-box f1" data-tip="X · int64 · 8 Б">0</div><div class="byte-box f1" data-tip="X · int64 · 8 Б">1</div></div><div class="seg-tag">X (int64)</div></div>
    <div class="byte-seg"><div class="cells"><div class="byte-box f2" data-tip="Y · int64 · 8 Б">8</div><div class="byte-box f2" data-tip="Y · int64 · 8 Б">9</div></div><div class="seg-tag">Y (int64)</div></div>
  </div>
</div>
{{< /raw >}}

## Виджеты {#widgets}

Форма 1 — пустой mount, оживляет `DG.widget` из `widgets.js`:

{{< widget id="w-ks-counter" note="— жми, число тикает" />}}

Форма 2 — mount со статик-фолбэком внутри (виден без JS):

{{< widget id="w-ks-fallback" note="— под ним статичная диаграмма" >}}<div class="mem"><div class="mem-lab">статик-фолбэк</div><div class="mem-row"><div class="word live" data-tip="виден без JS">e0</div></div></div>{{< /widget >}}

Форма 3 — без id, произвольный HTML прямо в figure:

{{< widget note="— свой HTML, без mount" >}}<div class="w-row"><span class="w-cap">произвольная разметка виджета</span></div>{{< /widget >}}

## Карточка {#card}

{{< bigcard href="/internals/memory-1-layout/" k="К эталону →" t="Значения и layout" s="Большая CTA-карточка: kicker, заголовок, подпись." >}}
