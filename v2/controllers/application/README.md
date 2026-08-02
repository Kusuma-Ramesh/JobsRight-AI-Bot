# controllers/application/

## Purpose
Controls third-party job application pages — the employer or ATS forms reached from a job
listing. Unlike the other controllers, this one must cope with pages whose structure is not
known in advance.

## Responsibilities
- Detect that the current tab is an application form and determine whether it is supported.
- Discover form fields and classify them (identity, contact, resume upload, free-text
  questions, consent checkboxes).
- Fill fields with values supplied by the caller and verify what was written.
- Upload resume files provided by the workflow.
- Detect submission results: success, validation failure, or an unrecoverable page.

## What belongs here
- Generic form discovery, classification, filling, and verification primitives.
- ATS-specific quirks and adapters, kept clearly separated from the generic path.
- Submission-result detection.

## What must NEVER belong here
- The values used to fill fields, or the logic that produces them — those come from
  activities.
- Resume generation or content authoring.
- Selector strings (see `selectors/`) or persisted run state (see `workflow/state/`).

## Dependencies
- `selectors/` for shared and ATS-specific selectors.
- `shared/` for waiting, retry, file handling, and browser access primitives.

## Future implementation notes
- Always verify a field after writing it; silent failures are the dominant failure mode on
  unknown forms.
- Never guess a submit action when the form is only partially understood — report an
  unsupported form and let the workflow decide.
- Capture a screenshot at submission time so runs remain auditable.
