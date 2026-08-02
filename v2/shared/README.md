# shared/

## Purpose
Cross-cutting primitives used by both controllers and the workflow layer: the low-level
building blocks that make browser automation reliable.

## Responsibilities
- Waiting and polling primitives (wait for element, wait for condition, wait for stability).
- Retry and backoff helpers with explicit, configurable policies.
- Timeout management and cancellation.
- Structured logging and run-scoped diagnostic output.
- Typed error definitions shared across layers.
- Browser access helpers (tab lookup, script injection, messaging).

## What belongs here
- Small, generic, dependency-light utilities with no knowledge of any specific application.
- Constants and type definitions used by more than one layer.

## What must NEVER belong here
- Anything specific to JobsRight, ChatGPT, application forms, or Bulk Job Apply.
- Workflow sequencing or business rules.
- Selectors.
- A catch-all "misc" or "helpers" dump; every utility must have a clear, documented purpose.

## Dependencies
- Browser/extension APIs only. Nothing from `controllers/` or `workflow/`.

## Future implementation notes
- Keep every utility pure and individually testable.
- Make timeouts and retry counts explicit parameters, never hidden defaults.
- Logging must be structured (run id, activity, application) so runs can be traced end to end.
