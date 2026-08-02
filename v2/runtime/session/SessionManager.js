import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * Owns the lifecycle of automation sessions.
 *
 * This is where the runtime connects the two engines. The manager creates a session, asks
 * the browser engine to discover the tabs the user opened, hands the workflow engine a
 * context to execute, persists state after every transition, and forwards both engines'
 * events onto the runtime bus. Neither engine holds a reference to the other.
 *
 * Only one session runs at a time: two concurrent runs would compete for the same browser
 * tabs, so a second start must be rejected rather than queued.
 */
export class SessionManager {
  /**
   * @param {object} [options]
   * @param {object} [options.stateStore]     `StateStore` for persistence.
   * @param {object} [options.eventBus]       `EventBus` for session-wide events.
   * @param {object} [options.logManager]     `LogManager` for structured logs.
   * @param {object} [options.configManager]  `ConfigManager` for runtime configuration.
   * @param {object} [options.workflowRunner] `WorkflowRunner` from `v2/workflow/engine`.
   * @param {object} [options.browserEngine]  `BrowserEngine` from `v2/engine/browser`.
   */
  constructor({ stateStore = null, eventBus = null, logManager = null, configManager = null, workflowRunner = null, browserEngine = null } = {}) {
    this.stateStore = stateStore;
    this.eventBus = eventBus;
    this.logManager = logManager;
    this.configManager = configManager;
    this.workflowRunner = workflowRunner;
    this.browserEngine = browserEngine;

    /** @type {import('./Session.js').Session|null} The single active session. */
    this.activeSession = null;
  }

  /**
   * Create a session without starting it.
   * @param {object} [options] `{ metadata }`
   * @returns {Promise<import('./Session.js').Session>}
   */
  async create(options) {
    // TODO: build the `Session`, persist it, and publish `EventTypes.SessionCreated`.
    throw new NotImplementedError('SessionManager.create');
  }

  /**
   * Start a session: initialize the browser engine, verify the required tabs exist, then
   * hand the workflow to the workflow runner. This is what "Start Automation" invokes;
   * everything after it is autonomous.
   *
   * @param {object} workflowDefinition Definition understood by the workflow engine.
   * @param {object} [options] `{ requirements: [{ role, urlPattern }] }`
   * @returns {Promise<import('../../workflow/engine/WorkflowResult.js').WorkflowResult>}
   */
  async start(workflowDefinition, options) {
    // TODO: reject when a session is already active — concurrent runs would fight over
    //       the same tabs.
    // TODO: initialize the browser engine and run `workflowRunner.prepare(requirements)`;
    //       abort with a clear list of missing roles rather than starting half-configured.
    // TODO: subscribe to both engines' events and republish them onto `eventBus`.
    // TODO: delegate to `workflowRunner.run(definition)` and persist the result.
    throw new NotImplementedError('SessionManager.start');
  }

  /**
   * Pause the active session at the next step boundary.
   * @returns {Promise<void>}
   */
  async pause() {
    // TODO: delegate to `workflowRunner.pause()`, snapshot state, publish SessionPaused.
    throw new NotImplementedError('SessionManager.pause');
  }

  /**
   * Resume a paused session, by id when it was suspended across a restart.
   * @param {string} [sessionId]
   * @returns {Promise<import('../../workflow/engine/WorkflowResult.js').WorkflowResult>}
   */
  async resume(sessionId) {
    // TODO: restore from `stateStore` when not in memory.
    // TODO: re-verify tabs before continuing — the user may have closed or navigated them
    //       while the session was paused.
    throw new NotImplementedError('SessionManager.resume');
  }

  /**
   * Stop the active session. Terminal: a stopped session is not resumable.
   * @param {string} [reason]
   * @returns {Promise<import('./Session.js').Session>}
   */
  async stop(reason) {
    // TODO: delegate to `workflowRunner.stop(reason)`, persist, publish SessionStopped.
    throw new NotImplementedError('SessionManager.stop');
  }

  /**
   * The session currently in progress, or null.
   * @returns {import('./Session.js').Session|null}
   */
  getActive() {
    // TODO: implement.
    throw new NotImplementedError('SessionManager.getActive');
  }

  /**
   * Load a session by id, from memory or the state store.
   * @param {string} sessionId
   * @returns {Promise<import('./Session.js').Session>}
   * @throws {RuntimeError} `SESSION_NOT_FOUND`
   */
  async get(sessionId) {
    // TODO: implement.
    throw new NotImplementedError('SessionManager.get');
  }

  /**
   * List known sessions, newest first.
   * @param {object} [filter] `{ status, since, limit }`
   * @returns {Promise<import('./Session.js').Session[]>}
   */
  async list(filter) {
    // TODO: implement.
    throw new NotImplementedError('SessionManager.list');
  }

  /**
   * Release everything the session held.
   * @returns {Promise<void>}
   */
  async dispose() {
    // TODO: shut down the browser engine, flush logs, clear the event bus, and clean
    //       `v2/data/temp`. Never close tabs the user opened manually.
    throw new NotImplementedError('SessionManager.dispose');
  }
}

export default SessionManager;
