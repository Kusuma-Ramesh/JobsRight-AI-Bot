# runtime/__tests__/

Unit-test placeholders for the browser detection layer.

No test runner is configured in this repository yet, so these files declare the cases in
`describe` / `it` form using a tiny local shim (`testHarness.js`) and can be executed
directly with `node`:

```
node v2/engine/browser/runtime/__tests__/UrlDetector.test.js
node v2/engine/browser/runtime/__tests__/TabDetector.test.js
```

Cases that are specified but not yet asserted are marked `it.todo(...)` and reported as
pending rather than passing, so an unwritten test can never be mistaken for a green one.

When a runner is adopted (`node:test` and Vitest are both drop-in fits for this structure),
these files should move onto it and `testHarness.js` should be deleted rather than kept as
a parallel framework.

`fakeBrowserApi.js` is the shared in-memory stand-in for the Chromium extension API — the
reason the detection layer takes `browserApi` as a constructor option is so no test needs a
real browser.
