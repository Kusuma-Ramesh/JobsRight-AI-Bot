import { BrowserEngineError, ErrorCode } from './../utils/Errors.js';

/**
 * Identifies the Chromium browser the engine is running in and confirms the extension APIs
 * it needs are actually available.
 *
 * This detector runs first: every other detection call assumes a usable `chrome.tabs` /
 * `chrome.windows` surface, and discovering that assumption is false halfway through a run
 * produces a confusing failure. Checking once, up front, turns it into a clear one.
 *
 * It also owns access to the browser API for the whole detection layer, including the
 * callback-versus-promise difference between browser builds, so no other file has to.
 */

/** Chromium-based browsers recognised from UA client hints or the user-agent string. */
export const CHROMIUM_BRANDS = Object.freeze([
  { id: 'chrome', name: 'Google Chrome', hints: ['Google Chrome'], ua: /\bChrome\/(\d+)/ },
  { id: 'edge', name: 'Microsoft Edge', hints: ['Microsoft Edge'], ua: /\bEdg\/(\d+)/ },
  { id: 'brave', name: 'Brave', hints: ['Brave'], ua: /\bBrave\/(\d+)/ },
  { id: 'opera', name: 'Opera', hints: ['Opera'], ua: /\bOPR\/(\d+)/ },
  { id: 'vivaldi', name: 'Vivaldi', hints: ['Vivaldi'], ua: /\bVivaldi\/(\d+)/ },
  { id: 'chromium', name: 'Chromium', hints: ['Chromium'], ua: /\bChromium\/(\d+)/ }
]);

/**
 * Brands that every Chromium build advertises. Edge, Brave, Opera, and Vivaldi all carry a
 * `Chrome/` token in their user-agent, so these only identify the browser when nothing more
 * specific matched.
 */
export const GENERIC_BRANDS = Object.freeze(['chrome', 'chromium']);

/** Extension APIs the detection layer requires. */
export const REQUIRED_APIS = Object.freeze(['tabs', 'windows']);

export class ChromeDetector {
  /**
   * @param {object} [options]
   * @param {object} [options.browserApi] Extension API namespace. Defaults to `chrome`,
   *                                      falling back to `browser`. Injected in tests.
   * @param {object} [options.navigator]  Navigator to read UA data from. Injected in tests.
   */
  constructor({ browserApi = null, navigator = null } = {}) {
    this.browserApi = browserApi ?? globalThis.chrome ?? globalThis.browser ?? null;
    this.navigator = navigator ?? globalThis.navigator ?? null;
  }

  /**
   * Report the Chromium browser this extension is running in.
   *
   * **Limitation, stated plainly:** an extension cannot enumerate the browsers installed on
   * the machine — no such API exists, and probing for one would be a fingerprinting
   * technique. What this returns is the browser hosting the extension, identified from UA
   * client hints where available and the user-agent string otherwise. The array shape is
   * kept because the caller's question ("which Chromium browsers can I drive?") has exactly
   * one answer from inside an extension: this one.
   *
   * @returns {Promise<Array<{ id: string, name: string, version: string|null, current: boolean, chromium: boolean }>>}
   */
  async detectInstalledBrowsers() {
    const brands = this.readBrands();
    const detected = [];

    for (const brand of CHROMIUM_BRANDS) {
      const hint = brands.find((entry) => brand.hints.some((name) => entry.brand?.includes(name)));
      if (hint) {
        detected.push({ id: brand.id, name: brand.name, version: hint.version ?? null, current: true, chromium: true });
      }
    }

    if (detected.length === 0) {
      const userAgent = this.navigator?.userAgent ?? '';
      for (const brand of CHROMIUM_BRANDS) {
        const match = brand.ua.exec(userAgent);
        if (match) detected.push({ id: brand.id, name: brand.name, version: match[1], current: true, chromium: true });
      }
    }

    // Every Chromium build advertises Chrome and Chromium alongside its own brand, so a
    // specific match always wins; otherwise Edge would be reported as Google Chrome.
    const specific = detected.filter((entry) => !GENERIC_BRANDS.includes(entry.id));
    if (specific.length > 0) return specific;

    // Plain Chrome advertises both generic brands; report it once, as Chrome.
    const chrome = detected.find((entry) => entry.id === 'chrome');
    return chrome ? [chrome] : detected;
  }

  /**
   * Confirm the engine is running inside a Chromium browser with the extension APIs the
   * detection layer needs.
   *
   * @returns {Promise<{ running: boolean, browser: object|null, extensionContext: boolean, missingApis: string[], reason: string|null }>}
   *          `running` is true only when a Chromium browser is detected *and* no required
   *          API is missing. `reason` explains a false, so the caller can surface something
   *          actionable instead of a bare boolean.
   */
  async detectRunningChrome() {
    const browsers = await this.detectInstalledBrowsers();
    const browser = browsers.find((entry) => entry.current) ?? null;
    const extensionContext = this.isExtensionContext();
    const missingApis = REQUIRED_APIS.filter((api) => !this.browserApi?.[api]);

    let reason = null;
    if (!browser) reason = 'No Chromium browser detected; only Chromium browsers are supported.';
    else if (!extensionContext) reason = 'Not running in an extension context; the tabs and windows APIs are unavailable.';
    else if (missingApis.length > 0) reason = `Missing required extension APIs: ${missingApis.join(', ')}.`;

    return { running: reason === null, browser, extensionContext, missingApis, reason };
  }

  /**
   * Whether the current context can call extension APIs at all.
   * @returns {boolean}
   */
  isExtensionContext() {
    return Boolean(this.browserApi?.runtime?.id);
  }

  /**
   * The extension API namespace, verified to exist.
   *
   * @returns {object}
   * @throws {BrowserEngineError} `ENGINE_NOT_INITIALIZED` when there is no API to use, so
   *                              detection fails at the boundary rather than as an
   *                              undefined-property error deeper in.
   */
  requireApi() {
    if (!this.browserApi) {
      throw new BrowserEngineError('No extension API available; the engine must run inside a Chromium extension.', {
        code: ErrorCode.ENGINE_NOT_INITIALIZED,
        recoverable: false
      });
    }
    return this.browserApi;
  }

  /**
   * Manifest of the running extension, or null outside an extension context.
   * @returns {object|null}
   */
  getExtensionInfo() {
    if (!this.isExtensionContext()) return null;
    const manifest = this.browserApi.runtime.getManifest?.() ?? {};
    return { id: this.browserApi.runtime.id, name: manifest.name ?? null, version: manifest.version ?? null };
  }

  /** UA client-hint brands, or an empty list when unavailable. */
  readBrands() {
    const brands = this.navigator?.userAgentData?.brands;
    return Array.isArray(brands) ? brands : [];
  }
}

/**
 * Call an extension API method that may return a promise (Manifest V3) or take a callback
 * (older builds and some forks), and resolve either way.
 *
 * Shared by every detector so the difference is handled in exactly one place.
 *
 * @param {object} namespace API namespace, e.g. `chrome.tabs`.
 * @param {string} method    Method name, e.g. `'query'`.
 * @param {...*} args        Arguments for the method.
 * @returns {Promise<*>}
 */
export function callBrowserApi(namespace, method, ...args) {
  const fn = namespace?.[method];
  if (typeof fn !== 'function') {
    return Promise.reject(
      new BrowserEngineError(`Extension API method ${method} is unavailable.`, {
        code: ErrorCode.ENGINE_NOT_INITIALIZED,
        recoverable: false,
        context: { method }
      })
    );
  }

  return new Promise((resolve, reject) => {
    let result;
    try {
      result = fn.call(namespace, ...args, (value) => {
        const lastError = globalThis.chrome?.runtime?.lastError;
        if (lastError) reject(new BrowserEngineError(lastError.message, { code: ErrorCode.INVALID_ARGUMENT, context: { method } }));
        else resolve(value);
      });
    } catch (error) {
      reject(error);
      return;
    }
    // Manifest V3 ignores the trailing callback and returns a promise instead.
    if (result && typeof result.then === 'function') result.then(resolve, reject);
  });
}

export default ChromeDetector;
