/* w-series-math: the arithmetic of the series bridge — the same numbers the
   «Anatomy of the theme» series has */
Taiga.widget("w-series-math", function (root) {
  root.innerHTML = "";

  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? {
        titles: ["Гайд — это папка", "Серия знает о себе всё", "Палитра — это один файл"],
        onPart: "ты на части",
        aria: "номер текущей части",
        seg: function (n, t, mins) {
          return "часть " + n + " · «" + t + "» · ~" + mins + " мин";
        },
        cap: function (n, total, left) {
          return left > 0
            ? "Кикер: «часть " + n + " из " + total +
              "» · мост: «осталось ~" + left + " мин»."
            : "Кикер: «часть " + n + " из " + total +
              "» · мост: остатка нет — серия дочитана.";
        }
      }
    : {
        titles: ["A guide is a folder", "A series knows itself", "A palette is one file"],
        onPart: "you are on part",
        aria: "number of the current part",
        seg: function (n, t, mins) {
          return "part " + n + " · “" + t + "” · ~" + mins + " min";
        },
        cap: function (n, total, left) {
          return left > 0
            ? "Kicker: “part " + n + " of " + total +
              "” · bridge: “~" + left + " min left”."
            : "Kicker: “part " + n + " of " + total +
              "” · bridge: nothing left — the series is read.";
        }
      };

  var parts = [
    { t: L.titles[0], mins: 5 },
    { t: L.titles[1], mins: 4 },
    { t: L.titles[2], mins: 5 }
  ];
  var cur = 2; // you are reading part 2 — an honest initial state

  var srow = document.createElement("div");
  srow.className = "gc-slider-row";
  srow.innerHTML = "<span>" + L.onPart + "</span>" +
    '<input type="range" min="1" max="' + parts.length + '" value="' + cur +
    '" aria-label="' + L.aria + '">' +
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
      seg.style.flexGrow = p.mins; // the bridge scale: segment width ∝ minutes
      seg.style.height = "14px";
      seg.style.fontSize = "0";
      seg.setAttribute("data-tip", L.seg(n, p.t, p.mins));
      scale.appendChild(seg);
      if (n > cur) left += p.mins;
    });
    cap.textContent = L.cap(cur, parts.length, left);
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
