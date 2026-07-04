/* w-hello: живое доказательство, что widgets.js из папки статьи подключился */
DG.widget("w-hello", function (root) {
  root.innerHTML = ""; // статик-фолбэк больше не нужен

  var clicks = 0;

  var row = document.createElement("div");
  row.className = "w-row";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "w-btn primary";
  btn.textContent = "нажми меня";

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "w-btn ghost";
  reset.textContent = "reset";

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = "клики <b>0</b>";
  var digit = num.querySelector("b");

  var badge = document.createElement("span");
  badge.className = "w-badge ok";
  badge.textContent = "смонтирован";
  badge.setAttribute("data-tip", "DG.widget нашёл mount по id и вызвал колбэк");

  var cap = document.createElement("div");
  cap.className = "w-cap";

  function paint() {
    digit.textContent = clicks;
    digit.classList.remove("tick");
    void digit.offsetWidth; // перезапуск анимации
    digit.classList.add("tick");
    cap.textContent = clicks === 0
      ? "Этот виджет живёт в widgets.js рядом с текстом, который ты сейчас читаешь."
      : "Счётчик — переменная в замыкании. Перезагрузи страницу: он честно обнулится.";
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
