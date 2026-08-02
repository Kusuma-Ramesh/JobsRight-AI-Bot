# controllers/jobsright/

## Purpose
Controls the JobsRight web application, the source of job listings and the primary system of
record for which jobs are candidates for an automated application.

## Responsibilities
- Locate and validate the JobsRight tab opened manually by the user.
- Verify the user is signed in and the expected view is loaded before any interaction.
- Enumerate visible job listings and expose them as structured, application-agnostic data.
- Open, read, and navigate individual job entries.
- Report the outcome of an application attempt back into JobsRight where applicable.

## What belongs here
- JobsRight navigation, pagination, and listing extraction primitives.
- JobsRight readiness, login-state, and empty-state detection.
- JobsRight-specific error classification (session expired, listing unavailable, rate limit).

## What must NEVER belong here
- Decisions about which job to apply to, or in what order — that is workflow logic.
- ChatGPT or Bulk Job Apply interactions.
- Selector strings (see `selectors/`) or persisted run state (see `workflow/state/`).

## Dependencies
- `selectors/` for JobsRight DOM selectors.
- `shared/` for tab access, waiting, and retry primitives.

## Future implementation notes
- Return normalized job objects so activities never depend on JobsRight's DOM shape.
- Treat listing extraction as read-only; mutations should be explicit, separate methods.
- Detect and surface session expiry immediately rather than retrying blindly.
