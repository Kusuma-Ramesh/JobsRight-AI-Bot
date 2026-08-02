# workflow/state/

## Purpose
Holds the durable representation of an automation run: what has been done, what is in
progress, what remains, and every result produced along the way. State is what makes a run
observable, resumable, and auditable.

## Responsibilities
- Define the run state schema and its allowed transitions.
- Persist state after every activity so an interrupted run can resume accurately.
- Provide read and write access for the engine, with validation on write.
- Record per-job outcomes, timestamps, and failure reasons.
- Support versioning so stored runs remain readable as the schema evolves.

## What belongs here
- State schema and transition definitions.
- Persistence and hydration logic.
- Run history and result records.

## What must NEVER belong here
- Business logic that decides the next step — that is the engine's job.
- Controller or DOM concerns.
- Large binary artifacts; those live under `data/` and are referenced by path.
- Credentials or personally identifying data beyond what a run strictly requires.

## Dependencies
- Chrome extension storage (or an equivalent persistence layer) once implemented.
- `shared/` for serialization and validation helpers.

## Future implementation notes
- Treat state as append-mostly: prefer recording new events over overwriting history.
- Write state before performing an irreversible side effect, so recovery never
  double-submits.
- Include a schema version field from the very first implementation.
