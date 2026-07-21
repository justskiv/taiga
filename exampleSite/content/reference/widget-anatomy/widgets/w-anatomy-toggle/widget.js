/* reference/widget-anatomy — w-anatomy-toggle (interactive).

   A fragment of the page's widget iife (see widgets/_shared/lib.js): `h` and
   the `W` guard above it are already in scope here — nothing re-declared. */
W.widget('w-anatomy-toggle', function (root) {
  var files = [
    { name: 'figure.html', hl: false, note: 'this widget’s no-JS fallback — what you saw before this script ran.' },
    { name: 'widget.js', hl: true, note: 'this file — it just replaced the fallback above and is now driving the mount.' }
  ];
  var i = 0;
  var count = 0;

  var row = h('div', 'w-row');
  var btn = h('button', 'w-btn primary', 'toggle');
  btn.type = 'button';
  var tag = h('span', 'wa-tag', files[i].name);
  row.appendChild(btn);
  row.appendChild(tag);

  var num = h('div', 'w-num');
  num.innerHTML = 'toggles <b>0</b>';
  var digit = num.querySelector('b');

  var cap = h('div', 'w-cap', files[i].note);

  function paint() {
    var f = files[i];
    tag.textContent = f.name;
    tag.className = 'wa-tag' + (f.hl ? ' wa-hl' : '');
    cap.textContent = f.note;
  }

  btn.addEventListener('click', function () {
    i = (i + 1) % files.length;
    count++;
    digit.textContent = count;
    digit.classList.remove('tick');
    void digit.offsetWidth; // restart the tick animation
    digit.classList.add('tick');
    paint();
  });

  root.innerHTML = ''; // drop the static fallback
  root.appendChild(row);
  root.appendChild(num);
  root.appendChild(cap);
  paint();
});
