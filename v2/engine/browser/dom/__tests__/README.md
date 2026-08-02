# DOM engine tests

## Running
```bash
node v2/engine/browser/dom/__tests__/DomEngine.test.js
node v2/engine/browser/dom/__tests__/ElementFinder.test.js
node v2/engine/browser/dom/__tests__/SelectorEngine.test.js
```

No test runner is configured in this repository, so these use the ~60-line harness in
`../../runtime/__tests__/testHarness.js`. It exists until a real runner is adopted and
should be deleted then, not grown.

## What the fake document proves — and what it does not
`fakeDom.js` is **not** a DOM implementation. It does not parse CSS or XPath: a selector is
a key in a map of prepared elements.

That is enough to test everything this engine owns:
- selector parsing, dialect inference, explicit prefixes, and fallback chains;
- dispatch to the CSS or XPath path, and typed errors for malformed expressions;
- visibility, enabled, viewport, and interactability judgements;
- wait/poll behaviour, including timeout and each awaited state;
- traversal, path computation, and the mapping of a node into `DomElement`;
- snapshot contents, missing-element reporting, and JSON round-trips.

It proves nothing about the browser's own CSS and XPath engines — which are not ours to
test. Coverage of real matching belongs in a runner with a real DOM (`jsdom`, or Chrome
itself); the `it.todo` cases marked as such should move there rather than grow a homegrown
selector engine here.

## Pending cases
`it.todo(...)` entries are specified but unwritten. They are reported as pending and are
never counted as passing.
