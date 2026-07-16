/* w-mins: an honest-mins estimate — itself made "in two touches", from this very article */
Taiga.widget("w-mins", function (root) {
  root.innerHTML = ""; // the static fallback is no longer needed

  // one bundle resource serves both translations — pick the strings by <html lang>
  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? {
        add: "+ раздел",
        reset: "reset",
        none: "Гайд без разделов — лид и чекпоинт: ~2 мин.",
        some: function (n, mins) {
          return n + " разд. × ~2 мин + лид: пиши mins: " + mins +
            " — и чипы с мостом серии будут говорить правду.";
        }
      }
    : {
        add: "+ section",
        reset: "reset",
        none: "A guide with no sections — the lead and the checkpoint: ~2 min.",
        some: function (n, mins) {
          return n + (n === 1 ? " section" : " sections") +
            " × ~2 min + the lead: write mins: " + mins +
            " — and the chips and the series bridge will tell the truth.";
        }
      };

  var sections = 0;

  var row = document.createElement("div");
  row.className = "w-row";

  var add = document.createElement("button");
  add.type = "button";
  add.className = "w-btn primary";
  add.textContent = L.add;

  var reset = document.createElement("button");
  reset.type = "button";
  reset.className = "w-btn ghost";
  reset.textContent = L.reset;

  var num = document.createElement("div");
  num.className = "w-num";
  num.innerHTML = "mins <b>2</b>";
  var digit = num.querySelector("b");

  var cap = document.createElement("div");
  cap.className = "w-cap";

  function paint() {
    var mins = 2 + sections * 2; // lead and checkpoint ~2 min + ~2 min per section
    digit.textContent = mins;
    digit.classList.remove("tick");
    void digit.offsetWidth; // restart the animation
    digit.classList.add("tick");
    cap.textContent = sections === 0 ? L.none : L.some(sections, mins);
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
