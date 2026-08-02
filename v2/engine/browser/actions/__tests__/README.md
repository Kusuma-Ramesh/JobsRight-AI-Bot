# Action engine tests

Run one file directly; there is no runner in the repository yet.

```bash
node v2/engine/browser/actions/__tests__/ActionEngine.test.js
```

`fakePage.js` builds elements that record every event dispatched at them, every focus, and
every `scrollIntoView`, over the DOM tests' fake document.

## What these prove
The part this layer owns: that nothing is touched before its state is checked, that the two
"cannot act" failures stay distinguishable, that each action dispatches the full event
sequence in the right order, that text goes through the native value setter, that typed text
never reaches a result, and that every path returns an `ActivityResult` rather than throwing.

## What they cannot prove
The browser's response to an untrusted event — whether a real framework re-renders, whether
a real form submits, whether a page's own `:hover` styling applies. That needs a real DOM.

The `todo` entries mark exactly those cases plus the ones needing real file objects. They
belong in a runner with `jsdom` or Chrome, and should move there rather than growing more
fakery here.
