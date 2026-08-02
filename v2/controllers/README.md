# controllers/

## Purpose
Controllers are the only place that knows how to talk to a specific external browser
application. Each controller exposes a stable, intention-revealing API (for example
"open the next job", "read the current job description", "submit the form") and hides every
detail of tabs, DOM structure, timing, and error recovery behind it.

## Responsibilities
- Own the lifecycle of a single external application: locating its tab, verifying it is
  ready, and reporting when it is not.
- Translate high-level intents from workflow activities into concrete browser interactions.
- Wait for and verify application state before and after each interaction.
- Raise typed, descriptive failures that the workflow engine can act on (retry, skip, abort).

## What belongs here
- One subdirectory per external application: `jobsright/`, `chatgpt/`, `application/`,
  `bulkjobapply/`.
- Application-specific readiness checks, navigation helpers, and interaction primitives.
- Application-specific error classification.

## What must NEVER belong here
- Workflow sequencing or business decisions — controllers never decide *what* to do next.
- Raw selector strings; those live in `selectors/`.
- Persistent run state; that lives in `workflow/state/`.
- Cross-application logic that coordinates two applications at once — that is an activity.

## Dependencies
- `selectors/` for all DOM lookups.
- `shared/` for waiting, retrying, logging, and browser access primitives.
- Nothing in `workflow/`. Controllers must remain usable without a workflow.

## Future implementation notes
- Controllers should be stateless with respect to the run: any value that must survive a
  step belongs in the workflow state.
- Prefer explicit readiness assertions over fixed delays.
- Every public controller method should be individually testable against a live tab.
