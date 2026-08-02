# selectors/

## Purpose
A single, centralized home for every DOM selector used by the automation. External web
applications change their markup frequently; concentrating selectors here means a UI change
is fixed in one file rather than scattered across the codebase.

## Responsibilities
- Define selectors grouped by application (JobsRight, ChatGPT, application forms,
  Bulk Job Apply).
- Provide fallback selectors and stable attribute-based alternatives where possible.
- Document what each selector targets and how to verify it is still correct.

## What belongs here
- Selector definitions and their fallbacks.
- Notes on the last verified date and known fragile selectors.

## What must NEVER belong here
- Any DOM querying, clicking, or waiting logic — selectors are data, not behavior.
- Conditional logic or branching.
- Workflow or business rules.

## Dependencies
- None. This directory must remain dependency-free so it can be read by any layer.

## Future implementation notes
- Prefer stable attributes (`data-*`, roles, accessible names) over structural CSS paths.
- Group selectors by application and then by screen or component.
- Provide ordered fallback lists so controllers can degrade gracefully when markup changes.
