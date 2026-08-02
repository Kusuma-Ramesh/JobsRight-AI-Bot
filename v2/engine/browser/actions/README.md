# Browser Action Engine

Everything that **changes** the page. The DOM engine next door only observes; this layer
clicks, types, scrolls, uploads, and sends keystrokes.

## Purpose
Reusable browser interactions, in the sense a UiPath activity is reusable: *Click*, *Type
Into*, *Hover*, *Send Hotkey* — operations defined by what they do to a browser, never by
which application they do it to.

## Responsibilities
- Resolve a target, confirm it is in a state that can be acted on, then interact.
- Dispatch the event sequences real pages listen for, not the single event that names the
  action.
- Return an `ActivityResult` for every outcome, success or failure.
- Fail with a stable, distinguishable error code.

## Files
| File | Role |
| --- | --- |
| `ActionEngine.js` | Façade. The public surface every caller uses. |
| `Action.js` | Shared base: resolve, validate, perform, wrap, event dispatch. |
| `ClickAction.js` | Primary-button click. |
| `DoubleClickAction.js` | Two click sequences plus `dblclick`. |
| `RightClickAction.js` | Secondary button and `contextmenu`. |
| `TypeTextAction.js` | Write text through the native value setter. |
| `ClearInputAction.js` | Empty a field, with the events a framework needs. |
| `HoverAction.js` | Pointer-over sequence, for hover-revealed UI. |
| `FocusAction.js` | Move `activeElement`. |
| `ScrollAction.js` | Scroll the window or a container by an offset. |
| `ScrollToElementAction.js` | Bring an element into view. |
| `UploadFileAction.js` | Attach a file to a file input. |
| `KeyboardAction.js` | Keys and shortcuts to the focused element. |

`Action.js` is not in the phase's file list. Every action needs the same resolve-validate-
wrap sequence, and duplicating it eleven times is how an automation layer acquires eleven
slightly different definitions of "ready".

## Public methods
`click`, `doubleClick`, `rightClick`, `hover`, `focus`, `typeText`, `appendText`,
`clearInput`, `uploadFile`, `scrollTo`, `scrollBy`, `pressKey`, `pressShortcut`.

Each is documented at its definition, with its failure codes.

## Design decisions

### Nothing is touched unsighted
Every action waits for its target and checks its state first. The required state is per
action, not global, because a single rule would be wrong in every direction:

| State | Actions | Why |
| --- | --- | --- |
| `Interactable` | `typeText`, `clearInput` | Writing text needs a field that accepts it. |
| `Clickable` | click, double, right, `focus`, keys | Rendered and not disabled. A **read-only** field qualifies: it takes clicks and focus, and is how most date pickers and combo boxes present their trigger. Requiring `Interactable` here would make every one of them undrivable. |
| `Visible` | `hover`, `scrollTo` | A disabled control can still show a tooltip. |
| `Present` | `uploadFile` | Real file inputs are hidden behind a styled button. |

### "Never appeared" and "appeared but unusable" stay separate
Resolution is two waits, not one. The first establishes whether the element ever existed
(`ELEMENT_NOT_FOUND`), the second whether it became usable (`ELEMENT_NOT_INTERACTABLE`,
carrying the validator's reason). One combined wait would report both as a timeout and lose
the distinction — which matters, because the first usually means a wrong selector and the
second usually means acting too early.

### Actions return, they do not throw
Every method resolves to an `ActivityResult` carrying `success`, a duration, a structured
error with a stable code and a `recoverable` flag, and a payload. That is the value an
activity produces, and the workflow engine decides to retry, skip, or abort by reading it.
An unexpected error is wrapped as `ACTION_FAILED` rather than escaping raw, so the contract
holds even for a bug.

### Event sequences, not single events
A lone `click` event misses the menu that opens on `mousedown` and the button that enables
on `pointerdown`; a lone `dblclick` misses both underlying clicks. Each action dispatches
what a browser would, in the order Pointer Events specifies — each compatibility mouse event
after its pointer counterpart, so a click is `pointerdown → mousedown → pointerup → mouseup
→ click`.

For typing, assigning `node.value` is not enough. React and similar frameworks install their
own `value` setter on the element and track what they last wrote — a plain assignment leaves
their state stale, so the field visibly holds text the application does not believe is there,
and the form submits empty. Text is written through the *prototype's* native setter, then
`input` and `change` are dispatched.

### What a synthetic event cannot do
Events dispatched from a page are untrusted, and no code in a content script can change
that. So:

- `pressKey('Enter')` runs a page's handlers but will **not** submit a form; `Tab` will not
  move focus, and a printable key inserts nothing. Use `typeText` for text, and click the
  submit control rather than pressing Enter at it.
- `hover` triggers JavaScript-driven menus, but CSS `:hover` never applies.
- `rightClick` can open a page's own menu; the browser's native one is chrome UI and stays
  closed.

These are documented at each method rather than papered over, because an action that
silently does nothing is worse than one that says it cannot.

### A file path cannot be uploaded from a page
Page JavaScript has no filesystem access: nothing here can turn `/home/user/resume.pdf` into
a file. `uploadFile` therefore takes a `File`/`Blob`, or bytes plus a name — read in the
extension's background context — and builds a `FileList` through `DataTransfer`, which is
the only way to populate `input.files`. A bare path is rejected with `UPLOAD_FAILED` and an
explanation, rather than attaching nothing and reporting success.

### User data does not enter results
`typeText` reports the length of what it wrote, never the text; `clearInput` reports the
length of what it removed. Results are persisted into workflow state, and these fields are
exactly where contact details and resume text live.

## Errors
| Code | Meaning |
| --- | --- |
| `ELEMENT_NOT_FOUND` | Nothing matched within the timeout. |
| `ELEMENT_NOT_INTERACTABLE` | Found, but hidden, disabled, zero-area — or, for the text actions only, read-only. |
| `TIMEOUT` | A wait elapsed. |
| `UPLOAD_FAILED` | The file could not be attached. |
| `INVALID_ARGUMENT` | Malformed selector, or an unsupported wait state. |
| `ACTION_FAILED` | The interaction itself did not take effect. |

## Dependencies
Browser Runtime, DOM Engine, and the Activity Framework (`ActivityResult`, `ActivityType`) —
nothing else. It does not import the workflow engine, the runtime, or any adapter, and it
has no knowledge of JobsRight, ChatGPT, Bulk Job Apply, resumes, prompts, or job
applications.

## What must never live here
- Selectors. Callers supply locators; `v2/selectors/` will hold them.
- Application knowledge or business rules — those belong in controllers.
- Workflow control flow, retry policy, or state persistence.
- Reading the page: that is the DOM engine's job, and keeping the split means a caller can
  tell at a glance whether a line of code can change anything.
