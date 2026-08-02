import { ChromeDetector } from './ChromeDetector.js';
import { TabDetector } from './TabDetector.js';
import { UrlDetector } from './UrlDetector.js';
import { WindowDetector } from './WindowDetector.js';

/**
 * The detection layer's façade: one object that answers "what is open right now?".
 *
 * The user opens JobsRight, ChatGPT, and the Bulk Job Apply extension by hand and then
 * presses Start Automation. Everything after that is unattended, so the run's first act is
 * to look at the browser and confirm the three targets are actually there. This class is
 * that act, and nothing more — it inspects, and never clicks, types, navigates, or opens a
 * tab.
 *
 * Discovered tabs are returned as `BrowserTab` models and cached per run, so later phases
 * can address "the ChatGPT tab" by id without re-scanning on every step.
 */

/**
 * Url patterns for the three known applications.
 *
 * This is the only site knowledge in the engine, and it is deliberately confined to data:
 * three lists of url patterns backing the three `find*Tab` helpers. No behavior, no
 * selectors, no assumptions about page structure — those belong in `v2/controllers/` and
 * `v2/selectors/`. Adding an application here means adding a list, not a code path.
 */
export const APPLICATION_PATTERNS = Object.freeze({
  jobsright: Object.freeze(['jobsright.ai', 'jobsright.com', 'app.jobsright.ai']),
  chatgpt: Object.freeze(['chatgpt.com', 'chat.openai.com']),
  bulkjobapply: Object.freeze(['bulkjobapply.com', 'app.bulkjobapply.com'])
});

/** Title fragments used as a fallback when a url pattern finds nothing. */
export const APPLICATION_TITLE_HINTS = Object.freeze({
  jobsright: 'jobsright',
  chatgpt: 'chatgpt',
  bulkjobapply: 'bulk job apply'
});

export class BrowserRuntime {
  /**
   * @param {object} [options]
   * @param {object} [options.browserApi]     Extension API namespace; defaults to `chrome`.
   * @param {ChromeDetector} [options.chromeDetector]
   * @param {WindowDetector} [options.windowDetector]
   * @param {TabDetector} [options.tabDetector]
   * @param {UrlDetector} [options.urlDetector]
   * @param {object} [options.patterns]       Overrides for `APPLICATION_PATTERNS`, so a
   *                                          self-hosted or staging deployment needs no
   *                                          code change.
   * @param {object} [options.logger]         Optional structured logger.
   */
  constructor({
    browserApi = null,
    chromeDetector = null,
    windowDetector = null,
    tabDetector = null,
    urlDetector = null,
    patterns = APPLICATION_PATTERNS,
    logger = null
  } = {}) {
    const api = browserApi ?? globalThis.chrome ?? globalThis.browser ?? null;

    this.browserApi = api;
    this.urlDetector = urlDetector ?? new UrlDetector();
    this.chromeDetector = chromeDetector ?? new ChromeDetector({ browserApi: api });
    this.windowDetector = windowDetector ?? new WindowDetector({ browserApi: api, logger });
    this.tabDetector = tabDetector ?? new TabDetector({ browserApi: api, urlDetector: this.urlDetector, logger });
    this.patterns = patterns;
    this.logger = logger;

    /** @type {Map<string, import('./../models/BrowserTab.js').BrowserTab>} role -> tab. */
    this.knownTabs = new Map();
  }

  // ── Browser-level detection ────────────────────────────────────────────────

  /**
   * Chromium browsers available to the engine. See `ChromeDetector.detectInstalledBrowsers`
   * for the important limitation: from inside an extension this reports the host browser,
   * because no API can enumerate what is installed on the machine.
   *
   * @returns {Promise<Array<object>>}
   */
  async detectInstalledBrowsers() {
    return this.chromeDetector.detectInstalledBrowsers();
  }

  /**
   * Whether a supported Chromium browser is running with the extension APIs the engine
   * needs.
   *
   * @returns {Promise<{ running: boolean, browser: object|null, extensionContext: boolean, missingApis: string[], reason: string|null }>}
   */
  async detectRunningChrome() {
    return this.chromeDetector.detectRunningChrome();
  }

  // ── Window and tab detection ───────────────────────────────────────────────

  /**
   * Every open browser window.
   * @param {object} [options] Forwarded to `WindowDetector.detectWindows`.
   * @returns {Promise<import('./../models/BrowserWindow.js').BrowserWindow[]>}
   */
  async detectWindows(options) {
    return this.windowDetector.detectWindows(options);
  }

  /**
   * Every open tab, optionally filtered.
   * @param {object} [filter] Forwarded to `TabDetector.detectTabs`.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab[]>}
   */
  async detectTabs(filter) {
    return this.tabDetector.detectTabs(filter);
  }

  /**
   * The active tab of the focused window, or null when the browser is not focused.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async getActiveTab() {
    return this.tabDetector.getActiveTab();
  }

  /**
   * The url of the active tab, or null.
   * @returns {Promise<string|null>}
   */
  async getCurrentURL() {
    return this.tabDetector.getCurrentURL();
  }

  /**
   * Tabs whose title matches.
   * @param {string|RegExp} title
   * @param {object} [options] `{ exact }`
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab[]>}
   */
  async getTabByTitle(title, options) {
    return this.tabDetector.getTabByTitle(title, options);
  }

  /**
   * Tabs whose url matches a bare host, wildcard pattern, or full url.
   * @param {string} pattern
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab[]>}
   */
  async getTabByURL(pattern) {
    return this.tabDetector.getTabByURL(pattern);
  }

  // ── Application helpers ────────────────────────────────────────────────────

  /**
   * Locate the JobsRight tab.
   * @param {object} [options] `{ required }` — throw instead of returning null.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async findJobsRightTab(options) {
    return this.findApplicationTab('jobsright', options);
  }

  /**
   * Locate the ChatGPT tab.
   * @param {object} [options] `{ required }`
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async findChatGPTTab(options) {
    return this.findApplicationTab('chatgpt', options);
  }

  /**
   * Locate the Bulk Job Apply tab.
   * @param {object} [options] `{ required }`
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   */
  async findBulkJobApplyTab(options) {
    return this.findApplicationTab('bulkjobapply', options);
  }

  /**
   * Locate a known application's tab by role.
   *
   * Url patterns are tried first; a title hint is only consulted when they find nothing,
   * because a title is user-visible text that changes with the page while a host does not.
   * When several tabs match, the active one wins and the ambiguity is reported — the caller
   * gets a tab *and* the knowledge that the choice was not clear-cut.
   *
   * @param {string} role One of the keys of `APPLICATION_PATTERNS`.
   * @param {object} [options]
   * @param {boolean} [options.required] Throw when the tab is absent, instead of returning null.
   * @returns {Promise<import('./../models/BrowserTab.js').BrowserTab|null>}
   * @throws {Error} When `required` is set and no tab matches.
   */
  async findApplicationTab(role, { required = false } = {}) {
    const patterns = this.patterns[role] ?? [];
    let { tab, matches } = await this.tabDetector.findUniqueTab(patterns);

    if (matches.length === 0 && APPLICATION_TITLE_HINTS[role]) {
      matches = await this.tabDetector.getTabByTitle(APPLICATION_TITLE_HINTS[role]);
      tab = matches.length === 1 ? matches[0] : null;
    }

    if (!tab && matches.length > 1) {
      tab = matches.find((candidate) => candidate.active) ?? matches[0];
      this.logger?.warn?.('browser.tab.ambiguous', { role, tabIds: matches.map((match) => match.id), chosen: tab.id });
    }

    if (tab) this.knownTabs.set(role, tab);
    else if (required) throw new Error(`No ${role} tab is open. Open it before starting the automation.`);

    return tab ?? null;
  }

  /**
   * Discover all three applications in one pass and report what is missing.
   *
   * This is what Start Automation calls: a run should refuse to begin with a clear list of
   * unopened applications rather than fail on step four.
   *
   * @param {string[]} [roles] Defaults to every known application.
   * @returns {Promise<{ ready: boolean, tabs: object, missing: string[] }>}
   */
  async detectApplications(roles = Object.keys(this.patterns)) {
    const tabs = {};
    const missing = [];

    for (const role of roles) {
      const tab = await this.findApplicationTab(role);
      if (tab) tabs[role] = tab;
      else missing.push(role);
    }

    return { ready: missing.length === 0, tabs, missing };
  }

  /**
   * A previously discovered tab for a role, without re-scanning.
   * @param {string} role
   * @returns {import('./../models/BrowserTab.js').BrowserTab|null}
   */
  getKnownTab(role) {
    return this.knownTabs.get(role) ?? null;
  }

  /**
   * Re-check a discovered tab, since the user may have closed or navigated it mid-run.
   * @param {string} role
   * @returns {Promise<boolean>}
   */
  async verifyKnownTab(role) {
    const tab = this.getKnownTab(role);
    if (!tab) return false;
    const patterns = this.patterns[role] ?? [];

    // With no patterns — a title-matched tab, or a role absent from an overridden pattern
    // set — the tab still existing is the only claim that can be checked, and `[].some()`
    // would otherwise report a perfectly open tab as gone.
    const stillValid = await Promise.all(
      patterns.length > 0
        ? patterns.map((pattern) => this.tabDetector.isStillValid(tab, pattern))
        : [this.tabDetector.isStillValid(tab)]
    );
    const valid = stillValid.some(Boolean);
    if (!valid) this.knownTabs.delete(role);
    return valid;
  }

  /**
   * A single snapshot of the browser: environment, windows, tabs, and which applications
   * were found. Intended for diagnostics and the pre-run report.
   *
   * @returns {Promise<object>}
   */
  async inspect() {
    const environment = await this.detectRunningChrome();
    const windows = await this.detectWindows();
    const tabs = await this.detectTabs();
    const applications = await this.detectApplications();

    return {
      detectedAt: new Date().toISOString(),
      environment,
      windowCount: windows.length,
      windows: windows.map((window) => window.toJSON()),
      tabCount: tabs.length,
      tabs: tabs.map((tab) => tab.toJSON()),
      applications: {
        ready: applications.ready,
        missing: applications.missing,
        tabs: Object.fromEntries(Object.entries(applications.tabs).map(([role, tab]) => [role, tab.toJSON()]))
      }
    };
  }
}

export default BrowserRuntime;
