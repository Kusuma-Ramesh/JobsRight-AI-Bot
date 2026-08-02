import { BrowserTab } from './../models/BrowserTab.js';
import { TargetNotFoundError, ErrorCode } from './../utils/Errors.js';
import { callBrowserApi } from './ChromeDetector.js';
import { UrlDetector } from './UrlDetector.js';

/**
 * Discovers browser tabs and reports them as `BrowserTab` models.
 *
 * Tabs are how the workflow addresses an application, so identifying the *right* tab is the
 * detection layer's central job. Two rules shape this file:
 *
 * - Lookups return every match rather than the first. When two tabs could be "the JobsRight
 *   tab", picking one silently is worse than reporting the ambiguity — the caller can
 *   decide, and a wrong-tab automation is very hard to diagnose after the fact.
 * - Matching goes through `UrlDetector`, never string equality, so a trailing slash or a
 *   tracking parameter cannot hide a tab that is plainly there.
 *
 * Inspection only: nothing here activates, opens, closes, or navigates a tab.
 */
export class TabDetector {
  /**
   * @param {object} [options]
   * @param {object} [options.browserApi]  Extension API namespace; defaults to `chrome`.
   * @param {UrlDetector} [options.urlDetector]
   * @param {object} [options.logger]      Optional structured logger.
   */
  constructor({ browserApi = null, urlDetector = null, logger = null } = {}) {
    this.browserApi = browserApi ?? globalThis.chrome ?? globalThis.browser ?? null;
    this.urlDetector = urlDetector ?? new UrlDetector();
    this.logger = logger;
  }

  /**
   * Enumerate open tabs.
   *
   * @param {object} [filter]
   * @param {number|string} [filter.windowId]   Restrict to one window.
   * @param {string} [filter.urlPattern]        Pattern understood by `UrlDetector.matches`.
   * @param {boolean} [filter.excludeRestricted] Drop `chrome://` and similar tabs the
   *                                            extension cannot inspect. Default false, so
   *                                            discovery reports what is genuinely open.
   * @returns {Promise<BrowserTab[]>}
   */
  async detectTabs({ windowId = undefined, urlPattern = undefined, excludeRestricted = false } = {}) {
    const query = windowId === undefined ? {} : { windowId };
    const native = await callBrowserApi(this.browserApi?.tabs, 'query', query);
    let tabs = (native ?? []).map((entry) => this.toModel(entry));

    if (urlPattern) tabs = tabs.filter((tab) => this.urlDetector.matches(tab.url, urlPattern));
    if (excludeRestricted) tabs = tabs.filter((tab) => !this.urlDetector.isRestricted(tab.url));
    return tabs;
  }

  /**
   * Fetch one tab by id, refreshing its state from the browser.
   *
   * @param {number|string} tabId
   * @returns {Promise<BrowserTab>}
   * @throws {TargetNotFoundError} `TAB_NOT_FOUND` when the tab no longer exists.
   */
  async getTab(tabId) {
    try {
      const native = await callBrowserApi(this.browserApi?.tabs, 'get', tabId);
      if (!native) throw new Error('no tab returned');
      return this.toModel(native);
    } catch {
      throw new TargetNotFoundError(`Tab ${tabId} was not found.`, {
        code: ErrorCode.TAB_NOT_FOUND,
        context: { tabId }
      });
    }
  }

  /**
   * The active tab of the focused window.
   *
   * @returns {Promise<BrowserTab|null>} Null when no browser window is focused.
   */
  async getActiveTab() {
    const native = await callBrowserApi(this.browserApi?.tabs, 'query', { active: true, lastFocusedWindow: true });
    const [first] = native ?? [];
    return first ? this.toModel(first) : null;
  }

  /**
   * The url of the active tab.
   *
   * @returns {Promise<string|null>} Null when nothing is focused or the tab reports no url.
   */
  async getCurrentURL() {
    const tab = await this.getActiveTab();
    return tab?.url || null;
  }

  /**
   * Find tabs whose title matches.
   *
   * @param {string|RegExp} title  Substring (case-insensitive) or regular expression.
   * @param {object} [options]
   * @param {boolean} [options.exact] Require the whole title to match. Ignored for RegExp.
   * @returns {Promise<BrowserTab[]>} Every match, newest window order preserved.
   */
  async getTabByTitle(title, { exact = false } = {}) {
    if (title === undefined || title === null || title === '') return [];
    const tabs = await this.detectTabs();
    return tabs.filter((tab) => matchesTitle(tab.title, title, exact));
  }

  /**
   * Find tabs whose url matches a pattern.
   *
   * @param {string} pattern Bare host, wildcard pattern, or full url.
   * @returns {Promise<BrowserTab[]>} Every match.
   */
  async getTabByURL(pattern) {
    if (!pattern) return [];
    return this.detectTabs({ urlPattern: pattern });
  }

  /**
   * Find the single tab matching a pattern, reporting ambiguity rather than guessing.
   *
   * @param {string|string[]} patterns One or more patterns; any match counts.
   * @returns {Promise<{ tab: BrowserTab|null, matches: BrowserTab[], ambiguous: boolean }>}
   */
  async findUniqueTab(patterns) {
    const list = Array.isArray(patterns) ? patterns : [patterns];
    const tabs = await this.detectTabs();
    const matches = tabs.filter((tab) => this.urlDetector.matchesAny(tab.url, list));
    return { tab: matches.length === 1 ? matches[0] : null, matches, ambiguous: matches.length > 1 };
  }

  /**
   * Whether a previously discovered tab is still open and still showing what it did.
   * Guards against a tab the user closed or navigated away mid-run.
   *
   * @param {BrowserTab} tab
   * @param {string} [expectedUrlPattern]
   * @returns {Promise<boolean>}
   */
  async isStillValid(tab, expectedUrlPattern) {
    if (!tab) return false;
    let current;
    try {
      current = await this.getTab(tab.id);
    } catch {
      return false;
    }
    if (!expectedUrlPattern) return true;
    return this.urlDetector.matches(current.url, expectedUrlPattern);
  }

  /**
   * Map a native tab object into a `BrowserTab`.
   *
   * @param {object} native
   * @returns {BrowserTab}
   */
  toModel(native) {
    return new BrowserTab({
      id: native.id,
      windowId: native.windowId ?? null,
      url: native.url ?? native.pendingUrl ?? '',
      title: native.title ?? '',
      active: Boolean(native.active),
      status: native.status ?? 'loading',
      index: native.index ?? -1,
      discarded: Boolean(native.discarded)
    });
  }
}

function matchesTitle(actual, expected, exact) {
  const title = actual ?? '';
  if (expected instanceof RegExp) return expected.test(title);
  const needle = String(expected).toLowerCase();
  const haystack = title.toLowerCase();
  return exact ? haystack === needle : haystack.includes(needle);
}

export default TabDetector;
