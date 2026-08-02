# workflow/activities/

## Purpose
Activities are the UiPath-style building blocks of the automation engine. In an RPA tool you
do not write a script that clicks a page — you compose a sequence of small, named activities
("Click", "Type Into", "Get Text", "Take Screenshot"), each with declared inputs, a timeout,
and a retry policy, and an engine executes them. This directory is the same idea for a
browser: a generic, reusable activity framework with no knowledge of any website.

That separation is what makes runs observable and resumable. Because an `Activity` is pure
data, it can be serialized into workflow state, replayed, inspected after the fact, or
reordered without touching execution code.

## Files
| File | Role |
| --- | --- |
| `Activity.js` | The activity model: `id`, `name`, `type`, `target`, `parameters`, `timeout`, `retries`, `status`, `createdAt`, plus structural validation and JSON round-tripping. |
| `ActivityStatus.js` | Lifecycle enum: `Idle`, `Running`, `Completed`, `Failed`, `Skipped`, `Retrying`. |
| `ActivityType.js` | The generic browser operations an activity can describe (click, type, read, wait, upload, download, scroll, tab management, screenshot). |
| `ActivityResult.js` | The outcome of one execution: `success`, `message`, `duration`, `error`, `payload`. |
| `ActivityRunner.js` | Skeleton executor. Owns validation, status transitions, timing, and retry accounting; delegates the actual interaction to handlers supplied later. |

## Responsibilities
- Describe a unit of work precisely enough that it can be executed, retried, logged, and
  audited without ambiguity.
- Own the execution contract: what a successful attempt means, how failures are reported,
  and how status moves through the lifecycle.
- Keep every activity independent so it can be reused across workflows and tested alone.

## What belongs here
- The generic activity model, enums, result type, and runner.
- New generic `ActivityType` values and their handlers as the framework grows.
- Validation of an activity's own shape and inputs.

## What must NEVER belong here
- JobsRight, ChatGPT, or Bulk Job Apply logic of any kind.
- Selectors, or any hard-coded DOM strings — a `target` is a reference resolved elsewhere.
- Playwright, Puppeteer, or any external browser-driver dependency.
- Workflow sequencing and global retry policy; the engine decides what runs next.
- Hidden shared mutable state between activities. All data flows through the engine via
  `parameters` in and `payload` out.

## Dependencies
- `v2/shared/` for waiting, backoff, logging, and browser access primitives (injected).
- `v2/selectors/` for resolving a `target`, reached through controllers — never imported
  directly by an activity.
- No third-party runtime dependencies.

## Execution model
```
engine → runner.run(activity)
           ├─ validate(activity)                  → Failed on invalid shape
           ├─ status = Running
           ├─ execute(activity, attempt)          → ActivityResult
           ├─ success? status = Completed
           └─ failure? attempts left ? Retrying : Failed
         ← ActivityResult { success, message, duration, error, payload }
```

## Future implementation notes
- `ActivityRunner.execute` is a deliberate stub. Implementation lands as a handler map keyed
  by `ActivityType`, injected into the runner, so the framework never imports browser code.
- Enforce `timeout` inside the attempt and classify errors as recoverable or fatal, so a
  fatal error stops retrying instead of exhausting every attempt.
- Keep activities idempotent where possible; a resumed run must not duplicate work.
- Name activities as verbs describing intent, and keep each small enough that a failure
  points at exactly one cause.
