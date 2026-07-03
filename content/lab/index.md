---
title: "Лаборатория"
params:
  kicker: "лаборатория · в разработке"
  headline: "Песочницы:"
  sub: "больше, чем виджеты"
  lead: "Виджеты в статьях — лёгкие, «в потоке чтения». Здесь будут их старшие братья: полноценные тренажёры с консолью, сценариями и свободной игрой. Раздел строится; первый прототип уже можно потрогать."
  foot: "Все тренажёры — vanilla JS, без зависимостей, работают офлайн."
---

## Прототип: тренажёр layout {#proto}

Собери `struct` из полей — смотри, как компилятор раскладывает его по байтам и сколько уходит на padding. Полная версия (drag-and-drop, пресеты, slice/string-режимы) — в работе; механика ниже — настоящая.

{{< widget id="w-lab" note="— добавь bool·int64·bool, потом нажми «оптимизировать»" >}}
<div class="w-row" id="lab-palette"></div>
<div class="w-row">
<span class="w-num">size <b id="lab-size">0</b> Б</span>
<span class="w-num">padding <b id="lab-waste" style="color:var(--accent-copper)">0</b> Б</span>
<span class="head-sp" style="flex:1"></span>
<button class="w-btn primary" id="lab-opt">оптимизировать ⤵</button>
<button class="w-btn ghost" id="lab-clear">очистить</button>
</div>
<div class="byte-strip" id="lab-strip" style="min-height:36px"></div>
<div class="w-cap" id="lab-cap">добавь поля кнопками сверху — соберём struct</div>
{{< /widget >}}

## Что появится {#plan}

<div class="rubs" style="grid-template-columns:repeat(2,1fr)">
<div class="rub" style="cursor:default">
<span class="r-k">память</span>
<span class="r-t">Тренажёр памяти</span>
<p class="r-d">Layout с drag-and-drop, slice с ползунками len/cap, retention и three-index — всё из серии «Память» в одной песочнице с консолью.</p>
<span class="r-m">прототип выше · <b>в работе</b></span>
</div>
<div class="rub" style="cursor:default">
<span class="r-k">планировщик</span>
<span class="r-t">Визуализатор G·M·P</span>
<p class="r-d">Очереди процессоров, воровство работы, syscall-паркинг — плеер сценариев с покадровой перемоткой.</p>
<span class="r-m"><b>проектируется</b></span>
</div>
<div class="rub" style="cursor:default">
<span class="r-k">gc</span>
<span class="r-t">GC-плеер</span>
<p class="r-d">Нарисуй свой граф объектов и прогони по нему трёхцветную маркировку с write barrier — шаг за шагом.</p>
<span class="r-m"><b>проектируется</b></span>
</div>
<div class="rub" style="cursor:default">
<span class="r-k">конкурентность</span>
<span class="r-t">Каналы и select</span>
<p class="r-d">Симулятор: горутины, буферы, блокировки и дедлоки — наглядно, с таймлайном происходящего.</p>
<span class="r-m"><b>идея</b></span>
</div>
</div>

{{< callout type="note" label="Как это связано со статьями" >}}
Каждый тренажёр привязан к серии: статья даёт **модель**, песочница — **правду под пальцами**. Ссылки «полный тренажёр →» из статей будут вести сюда.
{{< /callout >}}
