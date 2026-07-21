/* w-reflex: playground toy — a widget on an ordinary bundle, no trace of it in the theme */
Taiga.widget("w-reflex", function (root) {
  root.innerHTML = ""; // static fallback is no longer needed

  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? {
        start: "старт",
        wait: "жди…",
        go: "жми!",
        again: "ещё раз",
        unit: "мс",
        capIdle: "Жми «старт», дождись «жми!» — и кликай как можно быстрее.",
        falseStart: "Фальстарт: «жми!» ещё не было. Попробуй ещё раз.",
        reactionPre: "Реакция ",
        reactionMid: " мс · лучшая — ",
        reactionPost: " мс."
      }
    : {
        start: "start",
        wait: "wait…",
        go: "go!",
        again: "again",
        unit: "ms",
        capIdle: "Press \"start\", wait for \"go!\" — then click as fast as you can.",
        falseStart: "False start: \"go!\" hasn't shown up yet. Try again.",
        reactionPre: "Reaction ",
        reactionMid: " ms · best — ",
        reactionPost: " ms."
      };

  var state = "idle", t0 = 0, timer = null, best = 0;
  var row = document.createElement("div");
  row.className = "w-row";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "w-btn primary";
  btn.textContent = L.start;

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = L.unit + " <b>—</b>";
  var digit = num.querySelector("b");

  var cap = document.createElement("div");
  cap.className = "w-cap";
  cap.textContent = L.capIdle;
  row.appendChild(btn);
  row.appendChild(num);
  root.appendChild(row);
  root.appendChild(cap);

  btn.addEventListener("click", function () {
    if (state === "idle") {
      state = "wait";
      btn.textContent = L.wait;
      timer = setTimeout(function () {
        state = "go";
        t0 = performance.now();
        btn.textContent = L.go;
      }, 800 + Math.random() * 1700);
    } else if (state === "wait") {
      clearTimeout(timer); // false start
      state = "idle";
      btn.textContent = L.start;
      cap.textContent = L.falseStart;
    } else {
      var ms = Math.round(performance.now() - t0);
      if (!best || ms < best) best = ms;
      state = "idle";
      btn.textContent = L.again;
      digit.textContent = ms;
      cap.textContent = L.reactionPre + ms + L.reactionMid + best + L.reactionPost;
    }
  });
});
