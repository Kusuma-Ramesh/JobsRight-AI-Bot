# workflow/

## Purpose
The workflow layer is the brain of the automation. It defines the ordered sequence of
activities that make up a run, executes them, decides how to react to failures, and keeps a
durable record of progress. It is the only layer that knows the *business* meaning of a run.

## Responsibilities
- Define the automation as a declarative sequence of activities.
- Execute activities in order, passing inputs and collecting outputs.
- Apply retry, skip, and abort policies when an activity fails.
- Persist progress after every step so a run can be inspected, resumed, or cancelled.
- Expose the run lifecycle triggered by **Start Automation**: start, pause, resume, stop.

## What belongs here
- The workflow engine and run lifecycle.
- `activities/` — the individual units of work.
- `state/` — the durable representation of a run.
- Workflow-level policies: ordering, error handling, concurrency limits, stop conditions.

## What must NEVER belong here
- Direct DOM interaction or selector usage — always go through a controller.
- Application-specific quirks or waiting logic.
- Feature modules; a "feature" is expressed as one or more activities.

## Dependencies
- `controllers/` for all interaction with external applications.
- `shared/` for logging, timing, and error primitives.

## Future implementation notes
- Activities must be idempotent where possible so a resumed run does not duplicate work.
- Every state transition should be recorded before the side effect it describes is retried.
- Keep the engine generic: adding a step should mean adding an activity, not editing the
  engine.
