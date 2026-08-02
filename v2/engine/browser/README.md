# engine/browser/

## Purpose
The browser engine is the layer that knows *how* to drive a browser reliably, and nothing
about *which* browser applications this project automates. It is the RPA runtime underneath
the workflow: the workflow decides what to do, the engine performs it.

This directory currently contains architecture only — every method is a documented skeleton
that throws `NOT_IMPLEMENTED`. There is no Playwright, no Puppeteer, no browser logic.

## Design rules
1. **One façade.** The workflow layer talks only to `BrowserEngine`. It never reaches a
   manager, a service, or the DOM directly.
2. **No site knowledge.** Callers address elements by *selector key* and tabs by *role*.
   What a key or role means is defined outside the engine, in `v2/selectors/` and the
   controllers.
3. **Injected collaborators.** Nothing constructs its own dependencies; `BrowserContext`
   assembles them and passes them in, so the engine is testable without a browser.
4. **Typed errors.** Failures are `BrowserEngineError` subclasses carrying a stable `code`
   and a `recoverable` flag. Retry decisions are made from those, never from message text.
5. **Wait, act, verify.** Every interaction waits for a real observable condition, acts,
   then confirms the effect. Fixed sleeps are the main source of automation flakiness.

## Layout
```
engine/browser/
├── core/       orchestration and interaction
│   ├── BrowserEngine.js     façade; one method per capability
│   ├── BrowserContext.js    per-run dependency container and tab-role bindings
│   ├── WindowManager.js     window discovery and focus
│   ├── TabManager.js        tab discovery, matching, switching, lifecycle
│   ├── PageManager.js       readiness, navigation, and in-page interaction
│   └── SelectorResolver.js  selector key → live element, with ordered fallbacks
├── models/     pure, serializable observations
│   ├── BrowserWindow.js
│   ├── BrowserTab.js
│   └── BrowserPage.js
├── services/   cross-cutting concerns
│   ├── RetryService.js      recoverability-aware retry with backoff
│   ├── TimeoutService.js    deadlines and condition polling
│   ├── EventService.js      engine event bus
│   ├── Logger.js            structured, run-scoped logging
│   └── DownloadManager.js   file downloads and uploads
├── selectors/
│   └── SelectorRegistry.js  key → ordered selector candidates (mechanism only)
└── utils/
    ├── DomUtils.js          lowest-level DOM questions
    ├── UrlUtils.js          url normalisation and matching
    └── Errors.js            typed errors and error codes
```

## `BrowserEngine` surface
`detectWindows`, `focusWindow`, `detectTabs`, `switchTab`, `openTab`, `closeTab`,
`waitForPage`, `waitForElement`, `click`, `type`, `readText`, `readAttribute`, `scroll`,
`uploadFile`, `downloadFile`, `captureScreenshot`, `executeActivity`, plus `initialize`
and `shutdown`.

The list deliberately mirrors `ActivityType` in `v2/workflow/activities`: the engine is the
handler set that `ActivityRunner` is designed to receive. `executeActivity` is the seam —
the runner owns retry accounting and status transitions, the engine performs the interaction
and returns a payload.

```
ActivityRunner.run(activity)
   └─ engine.executeActivity(activity)      // dispatch on activity.type
        └─ BrowserEngine.click(tabId, key)  // façade
             └─ PageManager.click(...)      // wait → act → verify
                  └─ SelectorResolver.resolve(tabId, key)
                       └─ SelectorRegistry.get(key)   // data from v2/selectors
```

## Why models and managers are separate
A `BrowserTab` is a container that outlives navigations; a `BrowserPage` is the document
loaded in it right now. Keeping both lets the engine notice that a tab navigated away
mid-interaction — a common failure that is otherwise silent. Models are pure data and safe
to persist into workflow state; managers hold the behavior.

## What belongs here
- Generic browser capabilities and the reliability rules around them.
- New engine-level services, models, and typed errors.

## What must NEVER belong here
- JobsRight, ChatGPT, application-form, or Bulk Job Apply logic.
- Selector *values* — only the registry mechanism lives here; the data lives in
  `v2/selectors/`.
- Playwright, Puppeteer, or any external browser-driver dependency.
- Workflow sequencing, business decisions, or run state.
- Calls into the workflow layer. The engine emits events; the workflow observes them.

## Dependencies
- Browser extension APIs (tabs, windows, scripting, downloads) once implemented.
- `v2/selectors/` for registered selector data, loaded at `initialize()`.
- No third-party runtime dependencies.

## Future implementation notes
- Implement bottom-up: `Errors` → services → models → managers → `BrowserEngine`. The
  façade should stay a thin delegation layer.
- `waitForPage` must not trust `readyState: 'complete'` alone; single-page apps report it
  before rendering. Add a quiescence check.
- Non-idempotent operations (form submission, starting a bulk run) must be marked
  `retryable: false` so `RetryService` cannot double-submit them.
- Never log entered text or file contents; both can carry personal data.
- Keep every skeleton method's TODO list in sync as implementation lands.
