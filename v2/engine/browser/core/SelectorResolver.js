import { NotImplementedError } from './../utils/Errors.js';

/**
 * Turns a selector key into a live element reference.
 *
 * The resolver is the only component that closes the gap between a registry definition and
 * the DOM. It walks a definition's candidates in order, so a markup change degrades to the
 * next fallback instead of failing the run, and it reports which candidate matched so
 * selector health can be tracked.
 *
 * It resolves; it does not act. Clicking and typing belong to `PageManager`.
 */
export class SelectorResolver {
  /**
   * @param {object} [options]
   * @param {object} [options.registry]       `SelectorRegistry` instance.
   * @param {object} [options.timeoutService] `TimeoutService` instance.
   * @param {object} [options.logger]         `Logger` instance.
   */
  constructor({ registry = null, timeoutService = null, logger = null } = {}) {
    this.registry = registry;
    this.timeoutService = timeoutService;
    this.logger = logger;
  }

  /**
   * Resolve a key to a single element reference in a tab, waiting until it appears.
   *
   * @param {number|string} tabId
   * @param {string} key Registered selector key.
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {boolean} [options.visible]      Require the element to be visible.
   * @param {boolean} [options.interactable] Require it to be able to receive input.
   * @returns {Promise<object>} `{ key, candidateIndex, kind, value, handle }`
   * @throws {ElementNotFoundError} When no candidate matches before the deadline.
   */
  async resolve(tabId, key, options) {
    // TODO: read the definition from the registry and try each candidate in order.
    // TODO: apply `visible` / `interactable` filters via `DomUtils`.
    // TODO: report the winning candidate through `registry.recordOutcome`.
    throw new NotImplementedError('SelectorResolver.resolve');
  }

  /**
   * Resolve a key to every matching element.
   * @param {number|string} tabId
   * @param {string} key
   * @param {object} [options]
   * @returns {Promise<object[]>}
   */
  async resolveAll(tabId, key, options) {
    // TODO: implement; an empty result is valid here and must not throw.
    throw new NotImplementedError('SelectorResolver.resolveAll');
  }

  /**
   * Check for presence without waiting or throwing.
   * @param {number|string} tabId
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(tabId, key) {
    // TODO: implement as a single-pass resolve with a zero deadline.
    throw new NotImplementedError('SelectorResolver.exists');
  }

  /**
   * Resolve whichever of several keys appears first. Used where a site can present one of
   * multiple states (a form, a captcha, an error) and the caller must branch on which.
   *
   * @param {number|string} tabId
   * @param {string[]} keys
   * @param {object} [options]
   * @returns {Promise<{ key: string, handle: object }>}
   */
  async resolveAny(tabId, keys, options) {
    // TODO: implement as a race across candidates within one shared deadline.
    throw new NotImplementedError('SelectorResolver.resolveAny');
  }

  /**
   * Translate a definition candidate into an engine-native query.
   * @param {object} candidate `{ kind, value }`
   * @returns {object}
   */
  compile(candidate) {
    // TODO: implement per `SelectorKind`; `Text` and `Role` need accessible-name matching.
    throw new NotImplementedError('SelectorResolver.compile');
  }
}

export default SelectorResolver;
