import { NotImplementedError } from './WorkflowContext.js';

/**
 * Top-level coordinator for one automation session.
 *
 * The runner is the composition root: it builds the three subsystems, wires them together,
 * and owns the session lifecycle from "Start Automation" to a persisted result. Each
 * subsystem stays unaware of the others' internals.
 *
 *     WorkflowRunner
 *       ├── WorkflowEngine  — decides which step runs next
 *       ├── ActivityRunner  — executes one activity, owns per-activity retry and status
 *       └── BrowserEngine   — performs the actual browser operation
 *
 * The dependency direction is one-way: the engine calls the activity runner, which calls
 * the browser engine. Nothing calls back upward. Wiring them here — rather than letting
 * each construct its own collaborators — is what keeps every layer testable in isolation.
 *
 * Collaborators are injected rather than imported so this file has no compile-time coupling
 * to either subsystem.
 *
 * Every method is a skeleton and throws `NOT_IMPLEMENTED`.
 */
export class WorkflowRunner {
  /**
   * @param {object} [options]
   * @param {object} [options.workflowEngine] `WorkflowEngine` instance.
   * @param {object} [options.activityRunner] `ActivityRunner` from `v2/workflow/activities`.
   * @param {object} [options.browserEngine]  `BrowserEngine` from `v2/engine/browser`.
   * @param {object} [options.store]          Persistence from `v2/workflow/state`.
   * @param {object} [options.logger]         Structured logger.
   */
  constructor({ workflowEngine = null, activityRunner = null, browserEngine = null, store = null, logger = null } = {}) {
    this.workflowEngine = workflowEngine;
    this.activityRunner = activityRunner;
    this.browserEngine = browserEngine;
    this.store = store;
    this.logger = logger;

    /** @type {string|null} Identifies the current automation session. */
    this.sessionId = null;
  }

  /**
   * Build and connect the three subsystems for a session.
   *
   * @param {object} [options] Overrides for any collaborator or config value.
   * @returns {Promise<WorkflowRunner>}
   */
  static async create(options) {
    // TODO: construct the browser engine and initialize it.
    // TODO: construct the activity runner with the browser engine as its handler set.
    // TODO: construct the workflow engine with that activity runner and the state store.
    throw new NotImplementedError('WorkflowRunner.create');
  }

  /**
   * Verify the session can start before any automation happens.
   *
   * The user opens JobsRight, ChatGPT, and the Bulk Job Apply extension manually, so the
   * first job is discovery, not launching. Which tabs are required is supplied by the
   * caller as roles and url patterns — the runner itself knows no application names.
   *
   * @param {object[]} requirements `[{ role, urlPattern }]`
   * @returns {Promise<{ ready: boolean, missing: string[] }>}
   */
  async prepare(requirements) {
    // TODO: detect windows and tabs through the browser engine, bind each matched tab to
    //       its role, and report unmatched roles instead of proceeding half-configured.
    throw new NotImplementedError('WorkflowRunner.prepare');
  }

  /**
   * Run a workflow to completion. This is what "Start Automation" ultimately invokes.
   *
   * @param {object} definition Workflow definition: `{ id, name, steps, startStep }`.
   * @param {object} [options]
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async run(definition, options) {
    // TODO: create the session id and context, persist the initial state, then delegate
    //       to `workflowEngine.start()`.
    // TODO: subscribe to browser engine events and forward them to the logger so a run
    //       is traceable end to end.
    // TODO: always call `shutdown()` afterwards, including on failure.
    throw new NotImplementedError('WorkflowRunner.run');
  }

  /**
   * Resume a persisted session from its recorded position.
   * @param {string} sessionId
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async resumeSession(sessionId) {
    // TODO: rehydrate the context from the store, re-run `prepare` (tabs may have changed
    //       while the session was suspended), then delegate to `workflowEngine.resume()`.
    throw new NotImplementedError('WorkflowRunner.resumeSession');
  }

  /**
   * Pause the running session at the next step boundary.
   * @returns {Promise<void>}
   */
  async pause() {
    // TODO: delegate to `workflowEngine.pause()` and persist.
    throw new NotImplementedError('WorkflowRunner.pause');
  }

  /**
   * Cancel the running session.
   * @param {string} [reason]
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async stop(reason) {
    // TODO: delegate to `workflowEngine.stop(reason)`, then shut the browser engine down.
    throw new NotImplementedError('WorkflowRunner.stop');
  }

  /**
   * Current session status for the UI: workflow state, current step, and progress.
   * @returns {object}
   */
  getStatus() {
    // TODO: assemble from `workflowEngine.getCurrentState()` and `getCurrentStep()`.
    throw new NotImplementedError('WorkflowRunner.getStatus');
  }

  /**
   * Release every resource held by the session.
   * @returns {Promise<void>}
   */
  async shutdown() {
    // TODO: flush logs, persist the final result, and shut down the browser engine.
    // TODO: never close tabs the user opened manually.
    throw new NotImplementedError('WorkflowRunner.shutdown');
  }
}

export default WorkflowRunner;
