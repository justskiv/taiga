/* w-mins: прикидка честного mins — сам сделан «за два касания» из этой же статьи */
DG.widget("w-mins", function (root) {
  root.innerHTML = ""; // статик-фолбэк больше не нужен

  var sections = 0;

  var row = document.createElement("div");
  row.className = "w-row";

  var add = document.createElement("button");
  add.type = "button";
  add.className = "w-btn primary";
  add.textContent = "+ раздел";

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "w-btn ghost";
  reset.textContent = "reset";

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = "mins <b>2</b>";
  var digit = num.querySelector("b");

  var cap = document.createElement("div");
  cap.className = "w-cap";

  function paint() {
    var mins = 2 + sections * 2; // лид и чекпоинт ~2 мин + ~2 мин на раздел
    digit.textContent = mins;
    digit.classList.remove("tick");
    void digit.offsetWidth; // перезапуск анимации
    digit.classList.add("tick");
    cap.textContent = sections === 0
      ? "Гайд без разделов — лид и чекпоинт: ~2 мин."
      : sections + " разд. × ~2 мин + лид: пиши mins: " + mins +
        " — и чипы с мостом серии будут говорить правду.";
    reset.disabled = sections === 0;
  }

  add.addEventListener("click", function () { sections++; paint(); });
  reset.addEventListener("click", function () { sections = 0; paint(); });

  row.appendChild(add);
  row.appendChild(reset);
  row.appendChild(num);
  root.appendChild(row);
  root.appendChild(cap);
  paint();
});
