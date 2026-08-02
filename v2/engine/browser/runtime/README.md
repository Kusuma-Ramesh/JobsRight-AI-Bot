# engine/browser/runtime/ — Detection Layer

## Purpose
The first working part of the browser engine. It answers one question — **what is open
right now?** — and does nothing else. No clicking, typing, navigating, opening, closing, or
DOM access; no selectors; no workflow.

The user opens JobsRight, ChatGPT, and Bulk Job Apply by hand and then presses Start
Automation. Everything after that is unattended, so the run's first act must be to look at
the browser and confirm the three targets are actually there. That is this layer.

## Files
| File | Role |
| --- | --- |
| `BrowserRuntime.js` | Façade over the detectors; `detectApplications()`, `findJobsRightTab()`, `findChatGPTTab()`, `findBulkJobApplyTab()`, `inspect()`. |
| `ChromeDetector.js` | Identifies the host Chromium browser, verifies the required extension APIs, and owns access to the browser API. |
| `WindowDetector.js` | `detectWindows()`, `getFocusedWindow()`, `getWindow()` → `BrowserWindow`. |
| `TabDetector.js` | `detectTabs()`, `getActiveTab()`, `getCurrentURL()`, `getTabByTitle()`, `getTabByURL()`, `findUniqueTab()`, `isStillValid()` → `BrowserTab`. |
| `UrlDetector.js` | Url normalization and pattern matching — every rule for comparing urls. |

## Known limitation: `detectInstalledBrowsers()`
An extension **cannot enumerate the browsers installed on the machine**. No API exposes it,
and probing for one would be a fingerprinting technique. The method therefore reports the
Chromium browser hosting the extension, identified from UA client hints with a user-agent
fallback, and returns it in an array because from inside an extension the caller's real
question — "which Chromium browsers can I drive?" — has exactly one answer: this one.

Enumerating real installations would require a native messaging host, which is a separate
decision about packaging and permissions, not something to smuggle in here.

## Design decisions
**The browser API is injected, never reached for.** Every detector takes `browserApi` and
defaults to `chrome ?? browser`. That is what lets the whole layer be tested without a
browser — see `__tests__/fakeBrowserApi.js`.

**Native objects are mapped at the boundary.** Detection returns `BrowserWindow` and
`BrowserTab` models only, so no other layer ever handles a raw browser object.

**Callback and promise API styles are handled in one place.** `callBrowserApi()` in
`ChromeDetector` resolves either, so no detector repeats the check.

**Lookups return every match; ambiguity is reported, not resolved silently.** When two tabs
could be "the ChatGPT tab", `findUniqueTab()` returns `ambiguous: true` and no tab. The
`find*Tab` helpers then prefer the active tab and log a warning — a wrong-tab automation is
very hard to diagnose after the fact, so the choice is always visible.

**Urls are matched, never compared as strings.** A trailing slash, `www.`, a `utm_` param,
or a fragment must not hide a tab that is plainly open, so everything goes through
`UrlDetector.normalize`.

**Site knowledge is data, not code.** `APPLICATION_PATTERNS` is three lists of url patterns
backing the three required helpers — the only site knowledge in the engine. It is
constructor-overridable, so a staging or self-hosted deployment needs no code change, and
adding an application means adding a list. Page structure and behavior stay in
`v2/controllers/` and `v2/selectors/`.

**Restricted tabs are reported but never treated as automatable.** `chrome://` pages, the
Web Store, and devtools appear in `detectTabs()` because they are genuinely open;
`isRestricted()` marks them.

## Usage
```js
const runtime = new BrowserRuntime();

const { running, reason } = await runtime.detectRunningChrome();
if (!running) throw new Error(reason);

const { ready, tabs, missing } = await runtime.detectApplications();
if (!ready) throw new Error(`Open these first: ${missing.join(', ')}`);

tabs.jobsright.id; // address later phases by tab id
```

## Tests
Unit-test placeholders live in `__tests__/`, runnable today with `node` (no runner is
configured in this repo yet):

```
node v2/engine/browser/runtime/UrlDetector.test.js   # see __tests__/README.md
```

Unwritten cases are `it.todo(...)` and report as pending, never as passing.

## What must NEVER belong here
- Clicking, typing, scrolling, uploading, navigating, or opening/closing tabs.
- DOM access or selectors.
- Workflow sequencing or activity execution.
- Application behavior — how JobsRight paginates, how ChatGPT is prompted. Only the url
  patterns that identify those tabs.
- Playwright, Puppeteer, or any external browser-driver dependency.

## Future implementation notes
- Fold `UrlDetector`'s helpers into `utils/UrlUtils.js` when the interaction layer needs
  them, rather than duplicating the rules.
- Back `TabManager` / `WindowManager` with these detectors instead of re-querying.
- Publish `BrowserTabDetected` / `BrowserTabSwitched` onto the runtime `EventBus` once the
  engine holds a reference to it.
- Re-verify tabs on resume: the user may have closed or navigated them while paused —
  `verifyKnownTab()` is the hook.
