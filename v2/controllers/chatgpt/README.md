# controllers/chatgpt/

## Purpose
Controls the ChatGPT web application used during a run for generation and analysis steps
(for example tailoring resume content or answering application questions).

## Responsibilities
- Locate and validate the ChatGPT tab opened manually by the user.
- Send a prompt and reliably detect when the response is complete.
- Return the response as plain text or structured data to the calling activity.
- Detect and report degraded conditions: rate limits, network errors, regeneration prompts,
  and unexpected UI states.

## What belongs here
- Prompt submission, streaming-completion detection, and response extraction.
- Conversation hygiene helpers (starting a new chat, clearing an unusable conversation).
- ChatGPT-specific error classification.

## What must NEVER belong here
- Prompt authoring or prompt templates — the content of a prompt is workflow/activity logic.
- Interpretation of the response beyond mechanical extraction.
- JobsRight or Bulk Job Apply interactions.
- Selector strings (see `selectors/`).

## Dependencies
- `selectors/` for ChatGPT DOM selectors.
- `shared/` for tab access, waiting, and retry primitives.

## Future implementation notes
- Response completion must be verified by a stable signal, never a fixed timeout alone.
- Keep the controller agnostic to prompt content so prompts can evolve without code changes.
- Expect the ChatGPT UI to change often; isolate all fragility in selectors and readiness
  checks.
