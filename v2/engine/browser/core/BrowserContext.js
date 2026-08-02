import { NotImplementedError } from './../utils/Errors.js';

/**
 * The per-run container of engine collaborators and run-scoped state.
 *
 * Nothing in the engine constructs its own dependencies. Managers, services, and utilities
 * are assembled once into a context and injected, which is what keeps the engine testable
 * without a browser: swap the context, and the same code runs against fakes.
 *
 * The context holds *engine* state only — which tabs are bound to which roles, the run id,
 * the abort signal. Workflow state (which job is being applied to) lives in
 * `v2/workflow/state/` and never leaks in here.
 */
export class BrowserContext {
  /**
   * @param {object} init
   * @param {string} [init.runId]           Correlates every log, event, and artifact.
   * @param {object} [init.windowManager]
   * @param {object} [init.tabManager]
   * @param {object} [init.pageManager]
   * @param {object} [init.selectorResolver]
   * @param {object} [init.selectorRegistry]
   * @param {object} [init.retryService]
   * @param {object} [init.timeoutService]
   * @param {object} [init.eventService]
   * @param {object} [init.downloadManager]
   * @param {object} [init.logger]
   * @param {object} [init.config]          Engine-wide defaults (timeouts, retries, paths).
   */
  constructor({
    runId = null,
    windowManager = null,
    tabManager = null,
    pageManager = null,
    selectorResolver = null,
    selectorRegistry = null,
    retryService = null,
    timeoutService = null,
    eventService = null,
    downloadManager = null,
    logger = null,
    config = {}
  } = {}) {
    this.runId = runId;
    this.windowManager = windowManager;
    this.tabManager = tabManager;
    this.pageManager = pageManager;
    this.selectorResolver = selectorResolver;
    this.selectorRegistry = selectorRegistry;
    this.retryService = retryService;
    this.timeoutService = timeoutService;
    this.eventService = eventService;
    this.downloadManager = downloadManager;
    this.logger = logger;
    this.config = config;

    /** @type {Map<string, number|string>} Role name -> tab id, e.g. 'primary' -> 42. */
    this.boundTabs = new Map();
    /** @type {AbortController|null} Cancels every in-flight engine operation. */
    this.abortController = null;
  }

  /**
   * Build a fully wired context with default collaborators.
   * @param {object} [options] Overrides for any collaborator or config value.
   * @returns {BrowserContext}
   */
  static create(options) {
    // TODO: instantiate services, then managers, then the resolver, honouring overrides.
    throw new NotImplementedError('BrowserContext.create');
  }

  /**
   * Associate a discovered tab with a role the workflow can address by name. Roles are
   * assigned by the caller, keeping application names out of the engine.
   *
   * @param {string} role
   * @param {number|string} tabId
   * @returns {void}
   */
  bindTab(role, tabId) {
    // TODO: implement; reject rebinding a role that is already bound and still valid.
    throw new NotImplementedError('BrowserContext.bindTab');
  }

  /**
   * Resolve a role to its tab id.
   * @param {string} role
   * @returns {number|string}
   * @throws {TargetNotFoundError} When the role is unbound.
   */
  getTabId(role) {
    // TODO: implement.
    throw new NotImplementedError('BrowserContext.getTabId');
  }

  /**
   * Release a role binding, e.g. after the user closed the tab.
   * @param {string} role
   * @returns {void}
   */
  unbindTab(role) {
    // TODO: implement.
    throw new NotImplementedError('BrowserContext.unbindTab');
  }

  /**
   * Signal that shuts down every in-flight operation when the run is stopped.
   * @returns {AbortSignal}
   */
  get signal() {
    // TODO: lazily create the `AbortController` and return its signal.
    throw new NotImplementedError('BrowserContext.signal');
  }

  /**
   * Cancel all in-flight engine work.
   * @param {string} [reason]
   * @returns {void}
   */
  abort(reason) {
    // TODO: implement.
    throw new NotImplementedError('BrowserContext.abort');
  }

  /**
   * Release resources: listeners, timers, and temporary files.
   * @returns {Promise<void>}
   */
  async dispose() {
    // TODO: remove event listeners, flush the logger, clean `v2/data/temp`.
    throw new NotImplementedError('BrowserContext.dispose');
  }
}

export default BrowserContext;
