/* w-series-math: арифметика моста серии — те же числа, что у серии «Анатомия темы» */
Taiga.widget("w-series-math", function (root) {
  root.innerHTML = "";

  var parts = [
    { t: "Гайд — это папка", mins: 5 },
    { t: "Серия знает о себе всё", mins: 4 },
    { t: "Палитра — это один файл", mins: 5 }
  ];
  var cur = 2; // ты читаешь часть 2 — честное начальное состояние

  var srow = document.createElement("div");
  srow.className = "gc-slider-row";
  srow.innerHTML = "<span>ты на части</span>" +
    '<input type="range" min="1" max="' + parts.length + '" value="' + cur +
    '" aria-label="номер текущей части">' +
    '<span class="nval">' + cur + "</span>";
  var range = srow.querySelector("input");
  var nval = srow.querySelector(".nval");

  var scale = document.createElement("div");
  scale.className = "w-row";
  scale.style.gap = "3px";
  scale.style.marginTop = "12px";

  var cap = document.createElement("div");
  cap.className = "w-cap";

  function paint() {
    nval.textContent = cur;
    scale.innerHTML = "";
    var left = 0;
    parts.forEach(function (p, i) {
      var n = i + 1;
      var seg = document.createElement("div");
      seg.className = "word" + (n < cur ? " ro" : n === cur ? " live" : " spare");
      seg.style.flexGrow = p.mins; // шкала моста: ширина сегмента ∝ минутам
      seg.style.height = "14px";
      seg.style.fontSize = "0";
      seg.setAttribute("data-tip",
        "часть " + n + " · «" + p.t + "» · ~" + p.mins + " мин");
      scale.appendChild(seg);
      if (n > cur) left += p.mins;
    });
    cap.textContent = left > 0
      ? "Кикер: «часть " + cur + " из " + parts.length +
        "» · мост: «осталось ~" + left + " мин»."
      : "Кикер: «часть " + cur + " из " + parts.length +
        "» · мост: остатка нет — серия дочитана.";
  }

  range.addEventListener("input", function () {
    cur = +range.value;
    paint();
  });

  root.appendChild(srow);
  root.appendChild(scale);
  root.appendChild(cap);
  paint();
});
