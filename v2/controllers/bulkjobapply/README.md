# controllers/bulkjobapply/

## Purpose
Controls the Bulk Job Apply extension UI, which performs high-volume submissions for job
sets that do not require an individually tailored application.

## Responsibilities
- Locate and validate the Bulk Job Apply extension surface opened by the user.
- Verify it is configured and ready before a bulk run is started.
- Hand a prepared job set to the extension and start the bulk operation.
- Monitor progress and detect completion, stalling, or partial failure.
- Extract per-job results so the workflow can reconcile them with its own state.

## What belongs here
- Extension readiness and configuration checks.
- Bulk run start, monitoring, and result extraction primitives.
- Extension-specific error classification.

## What must NEVER belong here
- Selection of which jobs to include in a bulk run — that is workflow logic.
- Retry policy across runs, or reconciliation with JobsRight.
- Selector strings (see `selectors/`).

## Dependencies
- `selectors/` for Bulk Job Apply DOM selectors.
- `shared/` for tab access, waiting, and retry primitives.

## Future implementation notes
- Treat the extension as an untrusted black box: verify results rather than assuming success.
- Long-running bulk operations must expose incremental progress so the workflow can
  checkpoint and resume.
- Define an explicit timeout and stall-detection policy before implementing monitoring.
