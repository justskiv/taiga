/* w-reflex: игрушка песочницы — виджет обычного бандла, в теме от него ни следа */
DG.widget("w-reflex", function (root) {
  root.innerHTML = ""; // статик-фолбэк больше не нужен

  var state = "idle", t0 = 0, timer = null, best = 0;
  var row = document.createElement("div");
  row.className = "w-row";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "w-btn primary";
  btn.textContent = "старт";

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = "мс <b>—</b>";
  var digit = num.querySelector("b");

  var cap = document.createElement("div");
  cap.className = "w-cap";
  cap.textContent = "Жми «старт», дождись «жми!» — и кликай как можно быстрее.";
  row.appendChild(btn);
  row.appendChild(num);
  root.appendChild(row);
  root.appendChild(cap);

  btn.addEventListener("click", function () {
    if (state === "idle") {
      state = "wait";
      btn.textContent = "жди…";
      timer = setTimeout(function () {
        state = "go";
        t0 = performance.now();
        btn.textContent = "жми!";
      }, 800 + Math.random() * 1700);
    } else if (state === "wait") {
      clearTimeout(timer); // фальстарт
      state = "idle";
      btn.textContent = "старт";
      cap.textContent = "Фальстарт: «жми!» ещё не было. Попробуй ещё раз.";
    } else {
      var ms = Math.round(performance.now() - t0);
      if (!best || ms < best) best = ms;
      state = "idle";
      btn.textContent = "ещё раз";
      digit.textContent = ms;
      cap.textContent = "Реакция " + ms + " мс · лучшая — " + best + " мс.";
    }
  });
});
