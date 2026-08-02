# v2 — Workflow-Driven Automation Workspace

## Purpose
`v2/` is a clean implementation workspace for the commercial-grade job application
automation platform. It replaces the feature-module thinking of the legacy scaffold in
`src/` with a workflow-driven architecture modeled on enterprise RPA tools (UiPath-style):
a workflow engine executes ordered activities, and application controllers encapsulate all
knowledge about how to drive a specific browser application.

The legacy scaffold under `src/` remains untouched and is not referenced by anything here.

## Status
- **Overall progress:** 48%
- **Current phase:** Browser Actions — completed
- **Next phase:** JobsRight Adapter

## Automation model
Three browser applications participate in the automation:

1. **JobsRight** — source of job listings and application targets.
2. **ChatGPT** — used for generation and analysis steps.
3. **Bulk Job Apply Extension** — used for bulk submission flows.

The user opens all three tabs manually and clicks **Start Automation**. From that point on
the run is fully autonomous: the workflow engine drives every step, controllers perform the
actual browser interactions, and state is persisted so a run can be inspected, resumed, or
aborted.

## Responsibilities
- Define the boundaries between workflow orchestration, application control, and data.
- Hold every artifact of the v2 implementation (documentation now, code later).
- Provide the single entry point for starting, resuming, and stopping an automation run.

## What belongs here
- The top-level directories described below and their documentation.
- Later: the workflow engine, activities, controllers, selectors, shared utilities.

## What must NEVER belong here
- Feature modules such as `jobScanner`, `resumeGenerator`, `aiJobAnalyzer`, or `logger`.
  Those concepts are steps inside a workflow, not top-level architecture.
- Modifications to `src/`, the popup, the manifest, or `tests/`.
- Business logic placed directly at the root of `v2/`.

## Directory map
| Path | Role |
| --- | --- |
| `engine/browser/` | Browser engine: runtime detection, DOM inspection, page interaction, models, services. |
| `runtime/` | Session, state, events, config, and logging infrastructure. |
| `controllers/` | One controller per external browser application. |
| `workflow/` | Workflow engine, activities, and run state. |
| `selectors/` | Centralized DOM selector definitions. |
| `shared/` | Cross-cutting primitives used by controllers and workflow. |
| `data/` | Runtime artifacts produced by a run (resumes, screenshots, logs, temp). |

## Dependencies
- Chrome extension APIs (tabs, scripting, storage) once implementation begins.
- No external runtime dependencies are assumed at this stage.
- `workflow/` depends on `controllers/`; `controllers/` depend on `selectors/` and
  `shared/`. Dependencies never flow in the opposite direction.

## Future implementation notes
- Keep the dependency direction strictly one-way:
  `workflow → controllers → selectors/shared`.
- Every automation step must be expressible as an activity with explicit inputs, outputs,
  and failure handling, so runs are observable and resumable.
- Introduce code only after the contracts documented in each README are agreed on.

## Status
Documentation only. No implementation code exists in `v2/` yet.
