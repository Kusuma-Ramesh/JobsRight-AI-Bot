# DOM Engine

## Purpose
Locate and inspect elements inside a page. This is the layer that answers *"is it there,
what does it say, what state is it in"* — and nothing else.

## The boundary
The DOM engine **reads**. It finds, waits, measures, traverses, and describes.

It does not click, type, scroll, upload, submit, focus, navigate, or dispatch an event. Not
as a convenience, not as a private helper. Interaction belongs to the next phase (Browser
Actions), and the separation is what makes every method here safe to call at any point in a
run — including on a page that is mid-transition, where a stray click would be destructive.

It is also generic. No JobsRight, ChatGPT, or Bulk Job Apply knowledge, and no selectors of
its own: callers pass locators in, and `v2/selectors/` will be where they are stored.

## Files
| File | Role |
| --- | --- |
| `DomEngine.js` | Façade. The public surface every caller uses. |
| `SelectorEngine.js` | Resolves a `Selector` into live nodes; computes XPath and CSS paths. |
| `ElementFinder.js` | Finds, waits, traverses, and converts nodes into `DomElement`. |
| `ElementValidator.js` | Judges state: visible, enabled, in viewport, interactable. |
| `DomSnapshot.js` | Serializable capture of the page at one moment. |
| `../models/Selector.js` | A locator, as data. |
| `../models/DomElement.js` | A described element, as data. |

The two models live in `engine/browser/models/` with `BrowserTab` and `BrowserWindow`,
because that directory is where this engine's data models already live.

## Public methods
`findElement`, `findElements`, `elementExists`, `waitForElement`, `readText`, `readHTML`,
`readAttribute`, `getBoundingBox`, `getParent`, `getChildren`, `getXPath`, `getCssPath`,
`captureDomSnapshot`, plus `inspectElement` for an explainable state verdict.

Each is documented at its definition, with its failure modes.

## Design decisions

### Live nodes never leave
Every method returns a `DomElement`, not a node. A DOM node is only meaningful inside the
page it came from: it cannot be put into workflow state, written to a log, or persisted in a
snapshot, and holding one keeps a detached subtree alive after the page has moved on.
`DomElement` is the serializable form that crosses the boundary. The originating node stays
reachable through a non-enumerable `ref` for code running inside the page, so it can never
be serialized by accident.

### CSS and XPath, through one entry point
A selector's dialect is inferred (`//…` is XPath, everything else is CSS) and can be forced
with an `xpath=` or `css=` prefix. Callers never branch on dialect.

A `Selector` also carries `fallbacks`: alternative expressions tried in order when the
primary matches nothing. Page markup changes without notice, and a locator that can degrade
gracefully beats one that simply fails the run. A fallback accepts every form the primary
does — a prefix, an object, or a `Selector` — so it cannot be misread as the wrong dialect.

### User data is opt-in, everywhere
Both `innerHTML` and a form control's `value` are captured only when explicitly requested.
A value is whatever the user typed — name, email, resume text — and a `DomElement` travels
into workflow state and into snapshots under `v2/data/`, so capturing either by default
would persist exactly the data that must not be stored. Snapshots never capture values at
all.

### "Not found" and "found but hidden" are different failures
They have different causes and different fixes, so they are never collapsed into one
boolean. `ElementValidator` returns the individual checks and a `reason`, which is what lets
a failure say *"present but hidden by opacity"* rather than *"not interactable"*.

Being scrolled out of view is deliberately **not** counted as invisible — the element is
rendered, and a later phase can scroll to it. `isInViewport` answers that separately.

### A malformed selector throws; a missing element does not
`elementExists('<<<bad')` throws `INVALID_ARGUMENT`. Returning `false` would hide a typo
behind what looks like an absent element, and that class of bug is nearly invisible in an
unattended run.

The same applies to a wait condition: `waitForElement(sel, { state: 'visable' })` throws
`INVALID_ARGUMENT` before the first poll, rather than silently degrading to "just be
present" and succeeding against a hidden element.

### Waiting is polling
Not a `MutationObserver`: an observer fires on every mutation and would re-evaluate the same
predicate on each one. On a busy page — which all three applications are — a fixed-interval
poll does strictly less work, and cannot miss a state that was reached without a mutation
event. Interval and timeout are both injectable.

### Snapshots describe, they do not copy
Full markup is opt-in and off by default. These pages contain resume text and personal data,
and a snapshot is carried in workflow state and written to `v2/data/`. Capturing everything
by default would persist exactly the data that must not be stored. Pass `elements` instead:
a label-to-selector map that records the state of the locators a step depends on, which is
what makes a later failure diagnosable.

## Execution context
The engine runs where a `document` exists — a content script, or a function injected via
`chrome.scripting`. It never reaches for globals directly: `document` and `window` are
constructor parameters that default to the page's own, so the engine is testable outside a
browser and can be pointed at a frame.

## Dependencies
- `../models/` for `DomElement`, `Selector`.
- `../utils/Errors.js` for typed failures.
- Nothing from `workflow/`, `controllers/`, or `runtime/`. Dependencies point one way.

## Tests
```bash
node v2/engine/browser/dom/__tests__/DomEngine.test.js
node v2/engine/browser/dom/__tests__/ElementFinder.test.js
node v2/engine/browser/dom/__tests__/SelectorEngine.test.js
```
See `__tests__/README.md` for what the fake document does and does not prove.

## What must NEVER belong here
- Clicking, typing, scrolling, uploading, submitting, focusing, or dispatching events.
- Navigation or page lifecycle control.
- Site-specific selectors or logic for any of the three applications.
- Workflow decisions, retries as policy, or activity execution.
- Playwright or Puppeteer.

## Next phase
Browser Actions consumes this layer: it will resolve an element here, validate it here, and
only then interact — so an interaction can never be attempted on an element whose state was
never checked.
