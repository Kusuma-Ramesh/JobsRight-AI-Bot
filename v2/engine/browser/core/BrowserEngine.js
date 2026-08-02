import { NotImplementedError } from './../utils/Errors.js';

/**
 * The single façade the workflow layer talks to.
 *
 * `BrowserEngine` exposes one verb per browser capability and delegates each to the manager
 * that owns it. Two rules keep the architecture honest:
 *
 * 1. The workflow never touches a manager, a service, or the DOM directly — only this class.
 * 2. This class contains no site knowledge. Callers address targets by *selector key* and
 *    tabs by *role*; what those keys and roles mean is defined outside the engine.
 *
 * `executeActivity` is the bridge to `v2/workflow/activities`: it accepts an `Activity`
 * (pure data describing an interaction) and dispatches it to the matching method. That is
 * why the method list below mirrors `ActivityType` — the engine is the handler map the
 * `ActivityRunner` is designed to receive.
 *
 * Every method is a skeleton and throws `NOT_IMPLEMENTED` until execution is built.
 */
export class BrowserEngine {
  /**
   * @param {object} [options]
   * @param {object} [options.context] A `BrowserContext` holding managers and services.
   */
  constructor({ context = null } = {}) {
    this.context = context;
    this.initialized = false;
  }

  /**
   * Wire up the context and verify the engine can observe the browser.
   * Must be called before any other method.
   * @returns {Promise<void>}
   */
  async initialize() {
    // TODO: build the context when none was injected, register selector definitions from
    //       `v2/selectors`, and subscribe to browser lifecycle events.
    throw new NotImplementedError('BrowserEngine.initialize');
  }

  /**
   * Enumerate open browser windows.
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow[]>}
   */
  async detectWindows() {
    // TODO: delegate to `context.windowManager.detect()`.
    throw new NotImplementedError('BrowserEngine.detectWindows');
  }

  /**
   * Bring a window to the foreground.
   * @param {number|string} windowId
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow>}
   */
  async focusWindow(windowId) {
    // TODO: delegate to `context.windowManager.focus(windowId)`.
    throw new NotImplementedError('BrowserEngine.focusWindow');
  }

  /**
   * Enumerate open tabs, optionally filtered by window or url pattern.
   * @param {object} [filter]
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab[]>}
   */
  async detectTabs(filter) {
    // TODO: delegate to `context.tabManager.detect(filter)`.
    throw new NotImplementedError('BrowserEngine.detectTabs');
  }

  /**
   * Make a tab active and focus its window.
   * @param {number|string} tabId
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab>}
   */
  async switchTab(tabId) {
    // TODO: delegate to `context.tabManager.switchTo(tabId)`.
    throw new NotImplementedError('BrowserEngine.switchTab');
  }

  /**
   * Open a new tab.
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab>}
   */
  async openTab(url, options) {
    // TODO: delegate to `context.tabManager.open(url, options)`.
    throw new NotImplementedError('BrowserEngine.openTab');
  }

  /**
   * Close a tab the workflow owns.
   * @param {number|string} tabId
   * @returns {Promise<void>}
   */
  async closeTab(tabId) {
    // TODO: delegate to `context.tabManager.close(tabId)`.
    throw new NotImplementedError('BrowserEngine.closeTab');
  }

  /**
   * Wait until a tab's document is loaded and usable.
   * @param {number|string} tabId
   * @param {object} [options]
   * @returns {Promise<import('./../models/BrowserPage.js').BrowserPage>}
   */
  async waitForPage(tabId, options) {
    // TODO: delegate to `context.pageManager.waitForPage(tabId, options)`.
    throw new NotImplementedError('BrowserEngine.waitForPage');
  }

  /**
   * Wait for an element identified by a registered selector key.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @returns {Promise<object>}
   */
  async waitForElement(tabId, selectorKey, options) {
    // TODO: delegate to `context.pageManager.waitForElement(...)`.
    throw new NotImplementedError('BrowserEngine.waitForElement');
  }

  /**
   * Click an element.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async click(tabId, selectorKey, options) {
    // TODO: delegate to `context.pageManager.click(...)`.
    throw new NotImplementedError('BrowserEngine.click');
  }

  /**
   * Enter text into a field.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {string} text
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async type(tabId, selectorKey, text, options) {
    // TODO: delegate to `context.pageManager.type(...)`.
    throw new NotImplementedError('BrowserEngine.type');
  }

  /**
   * Read an element's visible text.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @returns {Promise<string>}
   */
  async readText(tabId, selectorKey, options) {
    // TODO: delegate to `context.pageManager.readText(...)`.
    throw new NotImplementedError('BrowserEngine.readText');
  }

  /**
   * Read an element's attribute.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {string} attribute
   * @param {object} [options]
   * @returns {Promise<string|null>}
   */
  async readAttribute(tabId, selectorKey, attribute, options) {
    // TODO: delegate to `context.pageManager.readAttribute(...)`.
    throw new NotImplementedError('BrowserEngine.readAttribute');
  }

  /**
   * Scroll a page or bring an element into view.
   * @param {number|string} tabId
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async scroll(tabId, options) {
    // TODO: delegate to `context.pageManager.scroll(tabId, options)`.
    throw new NotImplementedError('BrowserEngine.scroll');
  }

  /**
   * Attach a local file to a file input.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {string} filePath
   * @returns {Promise<void>}
   */
  async uploadFile(tabId, selectorKey, filePath) {
    // TODO: resolve the input, then delegate to `context.downloadManager.uploadFile(...)`.
    throw new NotImplementedError('BrowserEngine.uploadFile');
  }

  /**
   * Trigger a download and wait for the file to land.
   * @param {number|string} tabId
   * @param {string} selectorKey Element whose activation starts the download.
   * @param {object} [options]
   * @returns {Promise<{ path: string, filename: string }>}
   */
  async downloadFile(tabId, selectorKey, options) {
    // TODO: delegate to `context.downloadManager.expectDownload(...)`, passing a trigger
    //       that clicks the resolved element.
    throw new NotImplementedError('BrowserEngine.downloadFile');
  }

  /**
   * Capture a screenshot for auditing a run.
   * @param {number|string} tabId
   * @param {object} [options]
   * @returns {Promise<{ path: string, capturedAt: number }>}
   */
  async captureScreenshot(tabId, options) {
    // TODO: delegate to `context.pageManager.captureScreenshot(tabId, options)`.
    throw new NotImplementedError('BrowserEngine.captureScreenshot');
  }

  /**
   * Execute one workflow activity by dispatching on its `type`.
   *
   * This is the seam between the workflow and the engine: the `ActivityRunner` owns retry
   * accounting and status transitions, while the engine performs the interaction and
   * returns its payload. The engine reads `activity.target` and `activity.parameters`
   * and nothing else.
   *
   * @param {object} activity An `Activity` from `v2/workflow/activities`.
   * @returns {Promise<*>} The activity's payload (read text, file path, screenshot ref).
   */
  async executeActivity(activity) {
    // TODO: dispatch on `activity.type` (an `ActivityType`) to the methods above.
    // TODO: translate `activity.target` (selector key plus tab role) into a tab id and
    //       selector key via `context.getTabId`.
    // TODO: throw typed engine errors so `RetryService` can classify them; never return
    //       an `ActivityResult` from here — building that is the runner's job.
    throw new NotImplementedError('BrowserEngine.executeActivity');
  }

  /**
   * Release every resource held by the engine.
   * @returns {Promise<void>}
   */
  async shutdown() {
    // TODO: delegate to `context.dispose()` and mark the engine uninitialized.
    throw new NotImplementedError('BrowserEngine.shutdown');
  }
}

export default BrowserEngine;
