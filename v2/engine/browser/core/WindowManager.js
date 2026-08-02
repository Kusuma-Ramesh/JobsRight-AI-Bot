import { NotImplementedError } from './../utils/Errors.js';

/**
 * Discovers and controls browser windows.
 *
 * The user opens the three applications manually before starting a run, so the engine's
 * first job is to *discover* what is already open rather than to launch anything. This
 * manager owns that discovery at the window level and never opens a browser itself.
 */
export class WindowManager {
  /**
   * @param {object} [options]
   * @param {object} [options.eventService]   `EventService` instance.
   * @param {object} [options.timeoutService] `TimeoutService` instance.
   * @param {object} [options.logger]         `Logger` instance.
   */
  constructor({ eventService = null, timeoutService = null, logger = null } = {}) {
    this.eventService = eventService;
    this.timeoutService = timeoutService;
    this.logger = logger;
  }

  /**
   * Enumerate every open browser window.
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow[]>}
   */
  async detect() {
    // TODO: query the browser and map results into `BrowserWindow` models.
    // TODO: emit `EngineEvent.WindowDetected` for each window found.
    throw new NotImplementedError('WindowManager.detect');
  }

  /**
   * Fetch a single window by id.
   * @param {number|string} windowId
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow>}
   * @throws {TargetNotFoundError}
   */
  async get(windowId) {
    // TODO: implement.
    throw new NotImplementedError('WindowManager.get');
  }

  /**
   * Bring a window to the foreground. Required before interactions that depend on real
   * focus, such as file dialogs and some paste behaviours.
   *
   * @param {number|string} windowId
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow>}
   */
  async focus(windowId) {
    // TODO: focus, then verify the window reports `focused: true` before resolving.
    throw new NotImplementedError('WindowManager.focus');
  }

  /**
   * The window that currently has focus, or null when none does.
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow|null>}
   */
  async getFocused() {
    // TODO: implement.
    throw new NotImplementedError('WindowManager.getFocused');
  }

  /**
   * Restore a minimized window so its content can be captured and interacted with.
   * @param {number|string} windowId
   * @returns {Promise<void>}
   */
  async restore(windowId) {
    // TODO: implement.
    throw new NotImplementedError('WindowManager.restore');
  }

  /**
   * Find the window that contains a given tab.
   * @param {number|string} tabId
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow|null>}
   */
  async findByTab(tabId) {
    // TODO: implement.
    throw new NotImplementedError('WindowManager.findByTab');
  }
}

export default WindowManager;
