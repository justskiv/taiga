# codapi (vendored)

[codapi-js](https://github.com/nalgeon/codapi-js) by Anton Zhiyanov, MIT —
the engine behind the `run` shortcode. Only `snippet.js` is vendored; codapi's
own `snippet.css` is not, because the theme writes those layout rules itself
(`assets/css/25-code-editor.css`).

- Version: **0.20.0**
- Source: `https://unpkg.com/@antonz/codapi@<version>/dist/snippet.js`

`snippet.js` is kept byte-identical to upstream, so an upgrade can be diffed
against a fresh download. The MIT notice the licence asks for is prepended to
the **published** file at build time (`layouts/_partials/scripts.html`) — it is
not in this copy.

To upgrade: replace `snippet.js` with the same file from the new version, bump
the version here **and in the notice string in `scripts.html`**, and check that
`assets/css/25-code-editor.css` still describes codapi's markup (it re-styles
`codapi-toolbar`, `codapi-status`, `codapi-output`).

A site upgrades without touching the theme by dropping its own
`assets/vendor/codapi/snippet.js` over this one.
