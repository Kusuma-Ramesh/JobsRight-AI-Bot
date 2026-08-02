import { NotImplementedError } from './../utils/Errors.js';

/**
 * Discovers and controls browser tabs.
 *
 * Tabs are how the workflow addresses an application, so tab identity must survive an
 * entire run: a tab that is closed, reloaded, or replaced by the user has to be detected
 * rather than silently interacted with. This manager owns discovery, matching, switching,
 * and lifecycle for tabs. It knows nothing about which site is which — callers match by
 * url pattern.
 */
export class TabManager {
  /**
   * @param {object} [options]
   * @param {object} [options.windowManager]  `WindowManager` instance.
   * @param {object} [options.eventService]   `EventService` instance.
   * @param {object} [options.timeoutService] `TimeoutService` instance.
   * @param {object} [options.logger]         `Logger` instance.
   */
  constructor({ windowManager = null, eventService = null, timeoutService = null, logger = null } = {}) {
    this.windowManager = windowManager;
    this.eventService = eventService;
    this.timeoutService = timeoutService;
    this.logger = logger;
  }

  /**
   * Enumerate open tabs.
   * @param {object} [filter]
   * @param {number|string} [filter.windowId] Restrict to one window.
   * @param {string} [filter.urlPattern]      Match pattern understood by `UrlUtils.matches`.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab[]>}
   */
  async detect(filter) {
    // TODO: query the browser, map into `BrowserTab` models, apply the filter.
    // TODO: emit `EngineEvent.TabDetected` per match.
    throw new NotImplementedError('TabManager.detect');
  }

  /**
   * Fetch one tab by id, refreshing its state from the browser.
   * @param {number|string} tabId
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab>}
   * @throws {TargetNotFoundError} When the tab no longer exists.
   */
  async get(tabId) {
    // TODO: implement.
    throw new NotImplementedError('TabManager.get');
  }

  /**
   * Find the single tab matching a url pattern.
   * @param {string} urlPattern
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async findByUrl(urlPattern) {
    // TODO: implement; when several tabs match, report the ambiguity rather than
    //       silently picking one — the wrong tab is worse than a clear failure.
    throw new NotImplementedError('TabManager.findByUrl');
  }

  /**
   * Make a tab active in its window, focusing the window as well.
   * @param {number|string} tabId
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab>}
   */
  async switchTo(tabId) {
    // TODO: activate the tab, focus its window, then verify `active: true`.
    // TODO: emit `EngineEvent.TabSwitched`.
    throw new NotImplementedError('TabManager.switchTo');
  }

  /**
   * Open a new tab.
   * @param {string} url
   * @param {object} [options]
   * @param {number|string} [options.windowId]
   * @param {boolean} [options.active]
   * @param {boolean} [options.waitForLoad]
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab>}
   */
  async open(url, options) {
    // TODO: implement; emit `EngineEvent.TabOpened`.
    throw new NotImplementedError('TabManager.open');
  }

  /**
   * Close a tab.
   * @param {number|string} tabId
   * @returns {Promise<void>}
   */
  async close(tabId) {
    // TODO: implement; never close a tab the user opened manually unless the workflow
    //       explicitly owns it. Emit `EngineEvent.TabClosed`.
    throw new NotImplementedError('TabManager.close');
  }

  /**
   * The active tab of the focused window.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async getActive() {
    // TODO: implement.
    throw new NotImplementedError('TabManager.getActive');
  }

  /**
   * Confirm a previously discovered tab is still the same tab, not a reused id or a tab
   * the user navigated elsewhere.
   *
   * @param {import('./../models/BrowserTab.js').BrowserTab} tab
   * @param {string} [expectedUrlPattern]
   * @returns {Promise<boolean>}
   */
  async isStillValid(tab, expectedUrlPattern) {
    // TODO: implement using `UrlUtils.matches` against the tab's current url.
    throw new NotImplementedError('TabManager.isStillValid');
  }
}

export default TabManager;
