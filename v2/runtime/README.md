# runtime/

## Purpose
The runtime is the host the two engines run inside. It owns everything that outlives a
single step — the session, persisted state, the event stream, configuration, and the log —
and it is what connects the workflow engine to the browser engine without either one
depending on the other.

Architecture only: every method throws `NOT_IMPLEMENTED`. No browser automation, no
workflow logic, no application logic.

## How the runtime connects the two engines
```
                        ┌──────────────────────────┐
   Start Automation ───►│   runtime/SessionManager │  owns the session lifecycle
                        └────────────┬─────────────┘
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
        v2/workflow/engine                    v2/engine/browser
        WorkflowRunner / Engine               BrowserEngine
        decides WHAT happens next             performs browser operations
                    │                                 │
                    └──────────► events ◄─────────────┘
                                   │
        ┌──────────────┬───────────┴───────┬───────────────┐
        ▼              ▼                   ▼               ▼
    EventBus       StateStore          LogManager      ConfigManager
   one stream    resumable state      the run record   resolved settings
```

`SessionManager` is the only component that holds both engines. It initializes the browser
engine, verifies the tabs the user opened manually, hands the workflow to the workflow
runner, and republishes both engines' events onto one `EventBus`. Neither engine imports the
other; neither knows the runtime exists beyond the collaborators injected into it.

That gives one place to answer the questions an unattended run raises:
- *What is happening right now?* — `EventBus`
- *What happened?* — `LogManager`, persisted under `v2/data/logs/`
- *Can it resume?* — `StateStore`, snapshotted after every step
- *Under what settings did it run?* — `Config`, resolved once and frozen

## Layout
```
runtime/
├── session/
│   ├── Session.js         one automation session: id, times, status, workflow, artifacts
│   └── SessionManager.js  lifecycle; the only component holding both engines
├── state/
│   ├── StateStore.js      save / restore / snapshot / clear
│   └── StateSnapshot.js   immutable point-in-time capture, versioned from day one
├── events/
│   ├── Event.js           a published event (pure, serializable)
│   ├── EventBus.js        publish / subscribe / unsubscribe / clear
│   └── EventTypes.js      the event vocabulary, namespaced by emitting subsystem
├── config/
│   ├── Config.js          immutable resolved settings, with defaults
│   └── ConfigManager.js   layered resolution and validation
├── logging/
│   ├── LogEntry.js        one structured record
│   └── LogManager.js      info / warn / error / debug, buffering, redaction, flush
└── RuntimeErrors.js       typed runtime errors (see note below)
```

## Design decisions
**Two event buses, on purpose.** `EventService` in `v2/engine/browser` is internal to the
browser engine and carries only browser events. The runtime's `EventBus` is session-wide;
the runtime forwards browser events onto it. Keeping them separate is what stops the browser
engine from needing a reference to the runtime.

**Write state before the side effect.** `StateStore` snapshots after every step, and the
implementation rule is that state is persisted *before* an irreversible action, so a crash
between the two causes a repeated read rather than a duplicate submission.

**Snapshots are versioned from the first release.** A stored snapshot must stay readable
after the state shape changes; restoring an unmigratable version fails loudly instead of
resuming against a shape the code no longer understands.

**`Config` is immutable.** Settings are resolved once at session start and frozen. A value
that changed mid-run would make the run irreproducible and its logs misleading, so overrides
produce a new `Config`.

**Logs are structured and redacted.** Entries carry a stable `event` name plus machine-
readable `data`, never an interpolated sentence — thousands of entries are only useful if
they can be filtered and correlated. Redaction is mandatory: entered text, resume contents,
and credential-shaped values must never reach a log file.

**One session at a time.** Two concurrent runs would compete for the same browser tabs, so
a second start is rejected rather than queued.

## Note on `RuntimeErrors.js`
This file is an addition to the requested list. The runtime needs typed errors and a shared
`NotImplementedError`, and it deliberately does not reuse
`v2/engine/browser/utils/Errors.js`: those types descend from `BrowserEngineError`, and a
session or config failure is not a browser failure. Defining them here avoids making the
runtime depend on the browser engine's error hierarchy.

## What belongs here
- Session lifecycle, persistence, events, configuration, and logging.
- Anything cross-cutting that outlives a single workflow step.

## What must NEVER belong here
- Browser automation, selectors, or DOM access.
- Workflow sequencing, step routing, or activity execution.
- JobsRight, ChatGPT, application-form, or Bulk Job Apply logic.
- Credentials or secrets in configuration or logs.
- Playwright, Puppeteer, or any external browser-driver dependency.

## Dependencies
- `v2/workflow/engine/` and `v2/engine/browser/` — injected into `SessionManager`, never
  imported at module level, so the runtime has no compile-time coupling to either.
- Chrome extension storage as the default `StateStore` backend, injected rather than
  assumed.
- No third-party runtime dependencies.

## Future implementation notes
- Implement bottom-up: `RuntimeErrors` → `Event`/`EventBus` → `Config` → `LogManager` →
  `StateStore` → `SessionManager`.
- `SessionManager.start` must abort with the list of missing tab roles rather than starting
  half-configured.
- `resume` must re-verify tabs; the user may have closed or navigated them while paused.
- `dispose` must never close tabs the user opened manually.
- Flush logs periodically, not only at session end, so a crash still leaves a usable record.
