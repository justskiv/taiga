/* Kitchen-sink widget: exercises the Taiga.widget runtime (main.js) end to end —
   registered at top level, run on DOMContentLoaded, mounted by id, isolated in a
   try/catch. Uses the theme's widget building blocks (.w-row/.w-btn/.w-num). */
Taiga.widget('w-ks-counter', function (root) {
  var n = 0;
  root.innerHTML =
    '<div class="w-row">' +
      '<button class="w-btn primary" type="button">+1</button>' +
      '<span class="w-num"><b>0</b></span>' +
    '</div>';
  var out = root.querySelector('b');
  root.querySelector('button').addEventListener('click', function () {
    out.textContent = ++n;
    out.classList.remove('tick');
    void out.offsetWidth;        // restart the tick animation
    out.classList.add('tick');
  });
});
