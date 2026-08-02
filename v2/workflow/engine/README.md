# workflow/engine/

## Purpose
The workflow engine orchestrates a run. It decides which step executes next, how a failure
is routed, and when the run is complete — and it performs no interactions itself.

Architecture only: every method throws `NOT_IMPLEMENTED`. No browser automation, no
application logic.

## The three layers
```
WorkflowEngine   decides WHAT happens and in WHAT ORDER
      ↓          (steps, branching, conditions, retry policy, lifecycle)
ActivityRunner   PERFORMS one activity
      ↓          (per-activity retry accounting, status transitions, ActivityResult)
BrowserEngine    PERFORMS the browser operation
                 (tabs, waiting, clicking, typing, screenshots)
```

The separation is strict and one-way. The engine calls the activity runner; the activity
runner calls the browser engine; nothing calls back upward. Consequences worth stating
plainly:

- The workflow engine contains **no selectors, no DOM access, and no browser API calls**. A
  step names activity ids; it does not describe interactions.
- The activity framework contains **no sequencing**. It executes the one activity it is
  given and reports the outcome.
- The browser engine contains **no business meaning**. It clicks what it is told to click.
- No layer knows anything about JobsRight, ChatGPT, or Bulk Job Apply. Those live in
  `v2/controllers/` and `v2/selectors/`.

## Files
| File | Role |
| --- | --- |
| `WorkflowEngine.js` | Lifecycle and routing: `start`, `pause`, `resume`, `stop`, `next`, `previous`, `executeStep`, `executeWorkflow`, `getCurrentStep`, `getCurrentState`. |
| `WorkflowContext.js` | Per-run data carrier: `sessionId`, `workflowId`, `currentStep`, `variables`, `artifacts`, `timestamps`. Also exports the shared `NotImplementedError` marker. |
| `WorkflowState.js` | Lifecycle enum (`Idle`, `Starting`, `Running`, `Paused`, `Completed`, `Failed`, `Stopped`) plus the legal transition table. |
| `WorkflowStep.js` | One node: `id`, `name`, `activityIds`, `conditions`, `nextStep`, `errorStep`, `retryPolicy`. |
| `WorkflowResult.js` | Run outcome: `success`, `status`, `completedSteps`, `failedSteps`, `duration`, `errors`. |
| `WorkflowRunner.js` | Composition root: builds and wires `WorkflowEngine`, `ActivityRunner`, and `BrowserEngine`, and owns the session lifecycle. |

## Design decisions
**A workflow is a graph, not a list.** Routing lives on the step (`nextStep`, `errorStep`)
rather than being implied by array order, so a workflow can branch, loop, and send failures
down a recovery path without the engine hard-coding any sequence.

**State transitions are validated, not assigned.** `WORKFLOW_TRANSITIONS` declares what is
legal; resuming a stopped run or pausing a finished one is rejected rather than silently
corrupting a resumed run.

**The context is pure data.** It holds no engines and no live browser handles, so it can be
persisted after every step and rehydrated later. Steps communicate only through it — one
writes a variable, a later one reads it — which is what lets a step be reordered or re-run
without hidden coupling.

**Pausing happens at step boundaries.** A pause request is honoured after the current step
finishes, never mid-activity, so an interaction is never abandoned half-complete.

**`success` and `status` are separate on a result.** A run can finish (`Completed`) while
individual steps took their error path; "did it finish" and "did it work" are different
questions, and `failedSteps` records the difference.

**Retry exists at two levels.** An activity's own `retries` covers a flaky interaction;
`WorkflowStep.retryPolicy` covers re-running a whole step. They are deliberately distinct.

## What belongs here
- Lifecycle, routing, condition evaluation, and step-level retry policy.
- The workflow definition model and run result.

## What must NEVER belong here
- Browser automation, selectors, or DOM access.
- JobsRight, ChatGPT, application-form, or Bulk Job Apply logic.
- Playwright, Puppeteer, or any external browser-driver dependency.
- Direct construction of subsystems anywhere other than `WorkflowRunner`.

## Dependencies
- `v2/workflow/activities/` — injected as `activityRunner`.
- `v2/engine/browser/` — injected as `browserEngine`, and reached only through activities.
- `v2/workflow/state/` — injected as `store` for persistence.
- No third-party runtime dependencies. Collaborators are injected, never imported, so this
  directory has no compile-time coupling to either subsystem.

## Future implementation notes
- Validate the whole definition at `start()`: every `nextStep` and `errorStep` must resolve
  to a real step, or the run fails fast instead of mid-way.
- Guard `executeWorkflow` with a step-visit budget so a cycle in the definition cannot run
  forever.
- Persist the context after every step, before following the route, so a resumed run never
  repeats an irreversible side effect.
- `previous()` does not undo browser side effects; it must refuse to reverse past a step
  marked non-idempotent.
- `NotImplementedError` moves to `v2/shared/` once the shared error types exist.
