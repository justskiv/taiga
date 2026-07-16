/* w-palette: swatches out of the same #dg-themes JSON the header picker uses.
   A click sets data-theme on <html> — the real theme-switching mechanism. */
Taiga.widget("w-palette", function (root) {
  root.innerHTML = "";

  var RU = document.documentElement.lang.indexOf("ru") === 0;
  var L = RU
    ? {
        missing: "Список палитр не найден: на странице нет #dg-themes. " +
          "Обычно его выкладывает партиал пикера тем — без него виджету нечего показывать.",
        now: function (name, id) {
          return "Сейчас: «" + name + "» — атрибут data-theme=\"" + id +
            "\" стоит на <html>, дальше работает чистый CSS-каскад.";
        }
      }
    : {
        missing: "The palette list is missing: there is no #dg-themes on the page. " +
          "It is normally laid out by the theme picker's partial — without it the widget has nothing to show.",
        now: function (name, id) {
          return "Now: “" + name + "” — the data-theme=\"" + id +
            "\" attribute sits on <html>, and from there it is a pure CSS cascade.";
        }
      };

  var cap = document.createElement("div");
  cap.className = "w-cap";

  var src = document.getElementById("dg-themes");
  var themes = [];
  if (src) {
    try { themes = JSON.parse(src.textContent) || []; } catch (e) { themes = []; }
  }
  if (!themes.length) {
    cap.textContent = L.missing;
    root.appendChild(cap);
    return;
  }

  var html = document.documentElement;
  var row = document.createElement("div");
  row.className = "w-row";
  var btns = [];

  // up to four swatch colors: take any hex values out of the palette object
  function hexes(t) {
    if (Array.isArray(t.sw) && t.sw.length) return t.sw.slice(0, 4);
    var out = [];
    Object.keys(t).forEach(function (k) {
      var v = t[k];
      if (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) && out.length < 4) {
        out.push(v);
      }
    });
    return out;
  }

  function mark() {
    var curId = html.getAttribute("data-theme") || themes[0].id;
    var curName = curId;
    btns.forEach(function (b) {
      b.classList.toggle("primary", b._id === curId);
      if (b._id === curId) curName = b._name;
    });
    cap.textContent = L.now(curName, curId);
  }

  themes.forEach(function (t) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "w-btn";
    b._id = t.id; b._name = t.name || t.id;
    var sw = hexes(t).map(function (c) {
      return '<i style="display:inline-block;width:9px;height:9px;' +
        "border-radius:2px;margin-right:3px;background:" + c + '"></i>';
    }).join("");
    b.innerHTML = sw + (t.name || t.id);
    b.setAttribute("data-tip", "data-theme=\"" + t.id + "\"");
    b.addEventListener("click", function () {
      html.setAttribute("data-theme", t.id);
      mark();
    });
    row.appendChild(b); btns.push(b);
  });

  root.appendChild(row);
  root.appendChild(cap);
  mark();
});
