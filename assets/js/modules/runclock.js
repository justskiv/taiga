/* Honest timing for a run the reader never waited for.

   codapi answers with its own `duration` — how long the sandbox spent on the
   code, measured on the server. Put a cache in front of the runner and that
   answer is replayed byte for byte, `duration` included: a second Run on
   unchanged code lands in ~100 ms and still reports the 949 ms of the FIRST
   run. Formally true, and useless — the reader waited a tenth of that. Worse,
   the number does not move however many times they press, which reads as a
   widget stuck on an old value rather than as a cache doing its job.

   Nothing here reads a cache header, and there is no list of caches to keep up
   with. A server cannot answer in less time than it says the run itself took:
   when the wait is shorter than the reported duration, the answer was not
   computed for this request — it was replayed — and the only number left that
   describes anything that happened is the one measured on this side. A run
   that really did happen keeps the server's own figure, which is the better
   number for a guide about performance: it carries no network in it.

   The engine is WRAPPED, not replaced. codapi looks its engine up by name on
   every single run — `get engine(){ return codapi.engines[this.engineName] }`,
   read from inside its executor — so a wrapper installed at any time takes
   over from the next press, and the vendored transport underneath (the health
   check, the five HTTP error texts, the request timeout) stays exactly as
   shipped. Upgrading assets/vendor/codapi/snippet.js then carries none of that
   into the theme to be re-checked by hand. */

export function patchRunClock() {
  const codapi = window.codapi;
  const engine = codapi && codapi.engines && codapi.engines.codapi;
  /* no engine at all on a page with no runnable snippet — codapi is loaded
     only where one exists (scripts.html) — and `taigaClock` makes a second
     call a no-op rather than a wrapper around a wrapper. */
  if (!engine || engine.taigaClock) return;

  /* Only the networked engine. codapi's own `browser` engine runs the code in
     this tab and times it locally, so there is no cache in front of it and
     nothing to correct. */
  codapi.engines.codapi = Object.assign({}, engine, {
    taigaClock: true,
    async exec(req) {
      const t0 = performance.now();
      /* deliberately not in a try/catch: a transport failure has to reject
         exactly as it did before, or the snippet stops firing its `error`
         event and the reader gets a silent dead button instead of a message. */
      const res = await engine.exec(req);
      const waited = Math.round(performance.now() - t0);
      /* `waited` includes codapi's health check (1 s at worst, and cached for
         30 s), which is right: this measures the whole wait, from the press to
         the answer. A cached answer is an order of magnitude under the
         duration anyway. A failed request carries duration 0 and falls through
         here untouched, as does an engine that answered with no duration. */
      if (!res || typeof res.duration !== 'number' || waited >= res.duration) return res;
      /* `cached` is not shown anywhere by the theme; it rides along because it
         costs nothing and reaches the snippet's own `result` event, where a
         site can pick it up without forking this module. */
      return Object.assign({}, res, { duration: waited, cached: true });
    },
  });
}
