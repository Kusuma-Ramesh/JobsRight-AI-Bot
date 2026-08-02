import { NotImplementedError } from './../utils/Errors.js';

/**
 * Owns everything that happens *inside* a tab: readiness, navigation, and interaction.
 *
 * This is where the engine's reliability rules live. Every interaction here follows the
 * same discipline — wait for a real condition, act, then verify the effect — because a
 * click that lands on a not-yet-hydrated button and a `type` that no framework observed
 * both fail silently otherwise.
 *
 * `PageManager` receives already-resolved element references from `SelectorResolver`; it
 * never looks up selector keys itself and holds no site knowledge.
 */
export class PageManager {
  /**
   * @param {object} [options]
   * @param {object} [options.tabManager]      `TabManager` instance.
   * @param {object} [options.selectorResolver] `SelectorResolver` instance.
   * @param {object} [options.timeoutService]  `TimeoutService` instance.
   * @param {object} [options.retryService]    `RetryService` instance.
   * @param {object} [options.eventService]    `EventService` instance.
   * @param {object} [options.logger]          `Logger` instance.
   */
  constructor({ tabManager = null, selectorResolver = null, timeoutService = null, retryService = null, eventService = null, logger = null } = {}) {
    this.tabManager = tabManager;
    this.selectorResolver = selectorResolver;
    this.timeoutService = timeoutService;
    this.retryService = retryService;
    this.eventService = eventService;
    this.logger = logger;
  }

  /**
   * Snapshot the document currently loaded in a tab.
   * @param {number|string} tabId
   * @returns {Promise<import('./../models/BrowserPage.js').BrowserPage>}
   */
  async getPage(tabId) {
    // TODO: read url, title, and ready state; populate `navigationId`.
    throw new NotImplementedError('PageManager.getPage');
  }

  /**
   * Wait until a tab's document is usable.
   * @param {number|string} tabId
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {string} [options.urlPattern]  Also require the url to match.
   * @param {string} [options.readyState]  Minimum ready state; defaults to 'complete'.
   * @returns {Promise<import('./../models/BrowserPage.js').BrowserPage>}
   * @throws {TimeoutError}
   */
  async waitForPage(tabId, options) {
    // TODO: implement via `TimeoutService.waitFor`, never a fixed sleep.
    // TODO: also wait for network/DOM quiescence — 'complete' fires before single-page
    //       apps have rendered, which is the most common false-ready signal.
    throw new NotImplementedError('PageManager.waitForPage');
  }

  /**
   * Wait for an element to reach a required condition.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {boolean} [options.visible]
   * @param {boolean} [options.interactable]
   * @returns {Promise<object>} Resolved element reference.
   * @throws {ElementNotFoundError|TimeoutError}
   */
  async waitForElement(tabId, selectorKey, options) {
    // TODO: delegate to `SelectorResolver.resolve` with the shared deadline.
    throw new NotImplementedError('PageManager.waitForElement');
  }

  /**
   * Navigate a tab and wait for the new document.
   * @param {number|string} tabId
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<import('./../models/BrowserPage.js').BrowserPage>}
   */
  async navigate(tabId, url, options) {
    // TODO: implement; emit `EngineEvent.PageNavigated` on success.
    throw new NotImplementedError('PageManager.navigate');
  }

  /**
   * Click an element.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async click(tabId, selectorKey, options) {
    // TODO: wait for interactable, scroll into view, click, then verify an effect
    //       (navigation, DOM change, or caller-supplied assertion).
    throw new NotImplementedError('PageManager.click');
  }

  /**
   * Enter text into a field.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {string} text
   * @param {object} [options]
   * @param {boolean} [options.clear] Clear existing content first.
   * @returns {Promise<void>}
   */
  async type(tabId, selectorKey, text, options) {
    // TODO: focus, optionally clear, set the value, dispatch input/change events, then
    //       read the value back to confirm it stuck.
    // TODO: never log `text` — it can contain personal data.
    throw new NotImplementedError('PageManager.type');
  }

  /**
   * Read an element's visible text.
   * @param {number|string} tabId
   * @param {string} selectorKey
   * @param {object} [options]
   * @returns {Promise<string>}
   */
  async readText(tabId, selectorKey, options) {
    // TODO: implement via `DomUtils.getText`.
    throw new NotImplementedError('PageManager.readText');
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
    // TODO: implement via `DomUtils.getAttribute`.
    throw new NotImplementedError('PageManager.readAttribute');
  }

  /**
   * Scroll the page or an element.
   * @param {number|string} tabId
   * @param {object} [options]
   * @param {string} [options.selectorKey] Scroll this element into view when given.
   * @param {number} [options.x]
   * @param {number} [options.y]
   * @returns {Promise<void>}
   */
  async scroll(tabId, options) {
    // TODO: implement; wait for scroll position to settle before resolving so a
    //       subsequent click does not race lazy-loaded content.
    throw new NotImplementedError('PageManager.scroll');
  }

  /**
   * Evaluate a serializable function in the page context.
   * @param {number|string} tabId
   * @param {Function} fn
   * @param {Array<*>} [args]
   * @returns {Promise<*>}
   */
  async evaluate(tabId, fn, args) {
    // TODO: implement via the extension scripting API; arguments and the return value
    //       must be structured-cloneable.
    throw new NotImplementedError('PageManager.evaluate');
  }

  /**
   * Capture a screenshot of a tab.
   * @param {number|string} tabId
   * @param {object} [options]
   * @param {string} [options.path] Destination under `v2/data/screenshots/`.
   * @returns {Promise<{ path: string, capturedAt: number }>}
   */
  async captureScreenshot(tabId, options) {
    // TODO: implement; the tab must be active and its window visible to be captured.
    throw new NotImplementedError('PageManager.captureScreenshot');
  }
}

export default PageManager;
