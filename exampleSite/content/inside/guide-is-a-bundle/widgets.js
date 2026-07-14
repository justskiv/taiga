/* w-hello: live proof that widgets.js from the article's folder got wired in */
Taiga.widget("w-hello", function (root) {
  root.innerHTML = ""; // the static fallback is no longer needed

  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? {
        hit: "нажми меня",
        reset: "reset",
        clicks: "клики <b>0</b>",
        mounted: "смонтирован",
        mountedTip: "Taiga.widget нашёл mount по id и вызвал колбэк",
        cap0: "Этот виджет живёт в widgets.js рядом с текстом, который ты сейчас читаешь.",
        capN: "Счётчик — переменная в замыкании. Перезагрузи страницу: он честно обнулится."
      }
    : {
        hit: "click me",
        reset: "reset",
        clicks: "clicks <b>0</b>",
        mounted: "mounted",
        mountedTip: "Taiga.widget found the mount by id and called the callback",
        cap0: "This widget lives in the widgets.js next to the text you are reading.",
        capN: "The counter is a variable in a closure. Reload the page: it honestly drops to zero."
      };

  var clicks = 0;

  var row = document.createElement("div");
  row.className = "w-row";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "w-btn primary";
  btn.textContent = L.hit;

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "w-btn ghost";
  reset.textContent = L.reset;

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = L.clicks;
  var digit = num.querySelector("b");

  var badge = document.createElement("span");
  badge.className = "w-badge ok";
  badge.textContent = L.mounted;
  badge.setAttribute("data-tip", L.mountedTip);

  var cap = document.createElement("div");
  cap.className = "w-cap";

  function paint() {
    digit.textContent = clicks;
    digit.classList.remove("tick");
    void digit.offsetWidth; // restart the animation
    digit.classList.add("tick");
    cap.textContent = clicks === 0 ? L.cap0 : L.capN;
    reset.disabled = clicks === 0;
  }

  btn.addEventListener("click", function () { clicks++; paint(); });
  reset.addEventListener("click", function () { clicks = 0; paint(); });

  row.appendChild(btn);
  row.appendChild(reset);
  row.appendChild(num);
  row.appendChild(badge);
  root.appendChild(row);
  root.appendChild(cap);
  paint();
});
