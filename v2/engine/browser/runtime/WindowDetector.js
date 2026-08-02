import { BrowserWindow } from './../models/BrowserWindow.js';
import { TargetNotFoundError, ErrorCode } from './../utils/Errors.js';
import { callBrowserApi } from './ChromeDetector.js';

/**
 * Discovers browser windows and reports them as `BrowserWindow` models.
 *
 * The user opens the applications manually before starting a run, so the engine's job is
 * discovery, not launching: nothing here creates, moves, or closes a window. Mapping the
 * browser's native objects into models at this boundary means no other layer ever handles a
 * raw browser object, which is what keeps the rest of the engine testable without a browser.
 */
export class WindowDetector {
  /**
   * @param {object} [options]
   * @param {object} [options.browserApi] Extension API namespace; defaults to `chrome`.
   * @param {object} [options.logger]     Optional structured logger.
   */
  constructor({ browserApi = null, logger = null } = {}) {
    this.browserApi = browserApi ?? globalThis.chrome ?? globalThis.browser ?? null;
    this.logger = logger;
  }

  /**
   * Enumerate every open browser window.
   *
   * @param {object} [options]
   * @param {boolean} [options.populate]     Include tab ids on each window. Default true.
   * @param {boolean} [options.normalOnly]   Exclude popups and devtools windows. Default true,
   *                                         since an automation target is always a normal window.
   * @returns {Promise<BrowserWindow[]>}
   */
  async detectWindows({ populate = true, normalOnly = true } = {}) {
    const native = await callBrowserApi(this.browserApi?.windows, 'getAll', { populate });
    const windows = (native ?? []).map((entry) => this.toModel(entry));
    return normalOnly ? windows.filter((window) => window.type === 'normal') : windows;
  }

  /**
   * Fetch one window by id.
   *
   * @param {number|string} windowId
   * @param {object} [options]
   * @param {boolean} [options.populate]
   * @returns {Promise<BrowserWindow>}
   * @throws {TargetNotFoundError} `WINDOW_NOT_FOUND` when it no longer exists.
   */
  async getWindow(windowId, { populate = true } = {}) {
    try {
      const native = await callBrowserApi(this.browserApi?.windows, 'get', windowId, { populate });
      if (!native) throw new Error('no window returned');
      return this.toModel(native);
    } catch (cause) {
      throw new TargetNotFoundError(`Window ${windowId} was not found.`, {
        code: ErrorCode.WINDOW_NOT_FOUND,
        context: { windowId }
      });
    }
  }

  /**
   * The window that currently has focus.
   *
   * @returns {Promise<BrowserWindow|null>} Null when the browser itself is not focused —
   *          a normal condition while the user works in another application, not an error.
   */
  async getFocusedWindow() {
    const native = await callBrowserApi(this.browserApi?.windows, 'getLastFocused', { populate: true });
    if (!native || native.focused !== true) return null;
    return this.toModel(native);
  }

  /**
   * Find the window containing a given tab.
   *
   * @param {number|string} tabId
   * @returns {Promise<BrowserWindow|null>}
   */
  async findByTab(tabId) {
    const windows = await this.detectWindows({ populate: true, normalOnly: false });
    return windows.find((window) => window.tabIds.includes(tabId)) ?? null;
  }

  /**
   * Windows the user can currently see, i.e. not minimized.
   * @returns {Promise<BrowserWindow[]>}
   */
  async getVisibleWindows() {
    const windows = await this.detectWindows();
    return windows.filter((window) => window.isVisible());
  }

  /**
   * Map a native window object into a `BrowserWindow`.
   *
   * @param {object} native
   * @returns {BrowserWindow}
   */
  toModel(native) {
    return new BrowserWindow({
      id: native.id,
      focused: Boolean(native.focused),
      state: native.state ?? 'normal',
      type: native.type ?? 'normal',
      tabIds: Array.isArray(native.tabs) ? native.tabs.map((tab) => tab.id) : [],
      bounds:
        native.top === undefined
          ? null
          : { top: native.top, left: native.left, width: native.width, height: native.height }
    });
  }
}

export default WindowDetector;
