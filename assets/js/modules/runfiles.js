/* Every file a run sends ends with a newline, as a file on disk does.

   codapi reads the listing as the text of its code element, trimmed — `get
   value(){ return this.el.textContent.trim() }` in its snippet.js — so the
   last line reaches the sandbox without its newline. Most commands never
   notice. A diff does: `go fix -diff` and `gofmt -d` compare the file with
   its formatted self, which ends in a newline, and print `\ No newline at
   end of file` and a changed last line that the listing never had. The
   output the author recorded from a real file then differs from the
   reader's own run of the very same code.

   The newline goes back on the way out, after codapi has put the listing
   into its template, so it lands at the end of the file actually sent — and
   only where it is missing, so a template or a fetched file that already
   ends in one is sent as it is. A file that is not text (codapi parses a
   fetched JSON file) is left alone.

   The engine is WRAPPED, as runclock.js wraps it and for the same reason:
   codapi looks its engine up by name on every run, so this takes over from
   the next press, and the vendored snippet.js stays byte-identical to
   upstream. */
export function patchRunFiles() {
  const codapi = window.codapi;
  const engine = codapi && codapi.engines && codapi.engines.codapi;
  /* no engine on a page without a runnable snippet; `taigaFiles` makes a
     second call a no-op rather than a wrapper around a wrapper */
  if (!engine || engine.taigaFiles) return;
  codapi.engines.codapi = Object.assign({}, engine, {
    taigaFiles: true,
    exec(req) {
      return engine.exec(endFiles(req));
    },
  });
}

function endFiles(req) {
  if (!req || !req.files || typeof req.files !== 'object') return req;
  const files = {};
  Object.keys(req.files).forEach((name) => {
    const text = req.files[name];
    files[name] = typeof text === 'string' && text !== '' && !text.endsWith('\n') ? text + '\n' : text;
  });
  return Object.assign({}, req, { files });
}
