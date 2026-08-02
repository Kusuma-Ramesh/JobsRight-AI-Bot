# workflow/activities/

## Purpose
Activities are the smallest reusable units of work in the automation — the equivalent of RPA
activities. Each one performs a single meaningful step by calling controllers, and returns a
result the engine can record.

## Responsibilities
- Declare explicit inputs, outputs, and preconditions.
- Perform one step of the automation by orchestrating controller calls.
- Return a structured result: success with output, recoverable failure, or fatal failure.
- Remain independent of the surrounding sequence so activities can be reordered or reused.

## What belongs here
- One activity per step, each self-contained and independently testable.
- Prompt templates and field-mapping rules used by a step, since these are business content.
- Validation of an activity's own inputs and outputs.

## What must NEVER belong here
- Selectors, DOM access, or browser API calls — use controllers.
- Global sequencing decisions or retry policy — those belong to the engine.
- Hidden shared mutable state between activities; all data flows through the engine.

## Dependencies
- `controllers/` for every external interaction.
- `workflow/state/` for reading and writing run data through the engine.
- `shared/` for logging and error primitives.

## Future implementation notes
- Name activities as verbs describing intent (for example "collect job listings",
  "generate tailored resume", "submit application").
- Keep activities small enough that a failure points at exactly one cause.
- Design each activity to be safely re-runnable after an interrupted run.
