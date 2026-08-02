# data/

## Purpose
Holds the runtime artifacts produced by an automation run. Everything under this directory
is generated output, never source. It exists so runs are auditable and reproducible.

## Subdirectories
| Path | Contents |
| --- | --- |
| `resumes/` | Generated or tailored resume files produced during a run. |
| `screenshots/` | Screenshots captured at key steps, especially at submission and on failure. |
| `logs/` | Structured run logs and diagnostic output. |
| `temp/` | Short-lived intermediate files, safe to delete between runs. |

## Responsibilities
- Provide a predictable location for run artifacts referenced from workflow state.
- Keep generated output separate from source so it can be cleaned without risk.

## What belongs here
- Files written by a run, organized under the subdirectory that matches their kind.

## What must NEVER belong here
- Source code, configuration, or selectors.
- Credentials, API keys, or secrets of any kind.
- Files that must survive a cleanup — anything durable belongs in workflow state.

## Dependencies
- Written by `workflow/` and `controllers/`; read by nothing at build time.

## Future implementation notes
- Name artifacts with the run id and timestamp so they can be correlated with state records.
- Store only paths in workflow state, never file contents.
- Define a retention policy early; `temp/` should be cleared at the start of every run.
- Personally identifying data may pass through here, so treat the directory as sensitive and
  exclude generated artifacts from version control.
