import { DomElement } from './../models/DomElement.js';
import { ElementValidator } from './ElementValidator.js';
import { Selector } from './../models/Selector.js';
import { SelectorEngine } from './SelectorEngine.js';
import { WAIT_STATES, WaitState, isWaitState } from './WaitState.js';
import { BrowserEngineError, ElementNotFoundError, ErrorCode, TimeoutError } from './../utils/Errors.js';

/**
 * Finds elements and describes them as `DomElement` models.
 *
 * Two responsibilities that belong together: locating a node, and converting it into
 * something that can safely leave the page. Live nodes stop here — every method returns
 * serializable data, so nothing above this layer can accidentally hold a detached subtree
 * or try to put a DOM node into workflow state.
 *
 * Waiting is polling, not a `MutationObserver`. An observer fires on any mutation and would
 * need the same predicate evaluated on every one of them; on a busy page — which every
 * application here is — polling at a fixed interval does strictly less work and cannot miss
 * a state that was reached without a mutation event.
 */

/** How often `waitFor` re-checks, in milliseconds. */
export const DEFAULT_POLL_INTERVAL = 100;

/** How long `waitFor` waits before giving up, in milliseconds. */
export const DEFAULT_TIMEOUT = 15000;

export class ElementFinder {
  /**
   * @param {object} [options]
   * @param {SelectorEngine} [options.selectorEngine]
   * @param {ElementValidator} [options.validator]
   * @param {Document} [options.document]
   * @param {object} [options.window]
   * @param {number} [options.pollInterval]
   * @param {number} [options.timeout]
   */
  constructor({ selectorEngine = null, validator = null, document = null, window = null, pollInterval = DEFAULT_POLL_INTERVAL, timeout = DEFAULT_TIMEOUT } = {}) {
    this.selectorEngine = selectorEngine ?? new SelectorEngine({ document });
    this.validator = validator ?? new ElementValidator({ window });
    this.pollInterval = pollInterval;
    this.timeout = timeout;
  }

  /**
   * Find the first matching element.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options]
   * @param {Node} [options.root]      Subtree to search within.
   * @param {boolean} [options.html]   Include `innerHTML`. Off by default: markup is large,
   *                                   and most callers want text.
   * @param {boolean} [options.paths]  Compute `xpath` and `cssPath`. Off by default,
   *                                   because both walk the ancestor chain.
   * @param {boolean} [options.values] Capture the current value of a form control. Off by
   *                                   default: a value is user data.
   * @param {boolean} [options.required] Throw `ELEMENT_NOT_FOUND` instead of returning null.
   * @returns {DomElement|null}
   */
  find(selector, { root = null, html = false, paths = false, values = false, required = false } = {}) {
    const node = this.selectorEngine.queryFirst(selector, root);
    if (!node) {
      if (required) throw new ElementNotFoundError(`No element matched ${Selector.from(selector)}.`, { selector: String(Selector.from(selector)) });
      return null;
    }
    return this.describe(node, { html, paths, values });
  }

  /**
   * Find every matching element.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] Same as `find`, minus `required`.
   * @returns {DomElement[]}
   */
  findAll(selector, { root = null, html = false, paths = false, values = false } = {}) {
    return this.selectorEngine.query(selector, root).map((node) => this.describe(node, { html, paths, values }));
  }

  /**
   * Whether at least one element matches.
   *
   * A malformed selector is a programming error, not an absence, so it still throws — a
   * silent `false` would hide a typo behind what looks like a missing element.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {boolean}
   */
  exists(selector, { root = null } = {}) {
    return this.selectorEngine.queryFirst(selector, root) !== null;
  }

  /**
   * Wait until an element satisfies a condition, or the timeout elapses.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options]
   * @param {number} [options.timeout]   Milliseconds. Falls back to the selector's own
   *                                     timeout, then the finder's default.
   * @param {number} [options.interval]  Poll interval in milliseconds.
   * @param {string} [options.state]     `'present'` (default), `'visible'`, `'enabled'`,
   *                                     `'interactable'`, or `'absent'`.
   * @param {Node} [options.root]
   * @returns {Promise<DomElement|null>} The element, or null for `state: 'absent'`.
   * @throws {TimeoutError} `TIMEOUT`, naming the selector and the state that was awaited.
   * @throws {BrowserEngineError} `INVALID_ARGUMENT` for a state this layer does not
   *         support. Checked before the first poll, so a misspelled state fails
   *         immediately rather than resolving as soon as the element merely exists.
   */
  async waitFor(selector, { timeout = null, interval = null, state = WaitState.Present, root = null } = {}) {
    if (!isWaitState(state)) {
      throw new BrowserEngineError(`Unknown wait state '${state}'; expected one of ${WAIT_STATES.join(', ')}.`, {
        code: ErrorCode.INVALID_ARGUMENT,
        recoverable: false,
        context: { state }
      });
    }

    const resolved = Selector.from(selector);
    const deadline = Date.now() + (timeout ?? resolved.timeout ?? this.timeout);
    const step = interval ?? this.pollInterval;

    for (;;) {
      const node = this.selectorEngine.queryFirst(resolved, root);
      if (this.satisfies(node, state)) return state === WaitState.Absent ? null : this.describe(node, {});

      if (Date.now() >= deadline) {
        throw new TimeoutError(`Timed out after ${timeout ?? resolved.timeout ?? this.timeout}ms waiting for ${resolved} to be ${state}.`, {
          selector: String(resolved),
          state
        });
      }
      await delay(Math.min(step, Math.max(0, deadline - Date.now())));
    }
  }

  /**
   * Whether a node meets a wait condition.
   *
   * @param {Node|null} node
   * @param {string} state
   * @returns {boolean}
   */
  satisfies(node, state) {
    switch (state) {
      case WaitState.Absent:
        return node === null;
      case WaitState.Visible:
        return node !== null && this.validator.isVisible(node);
      case WaitState.Enabled:
        return node !== null && this.validator.isEnabled(node);
      case WaitState.Clickable:
        return node !== null && this.validator.isClickable(node);
      case WaitState.Interactable:
        return node !== null && this.validator.isInteractable(node);
      case WaitState.Present:
        return node !== null;
      default:
        throw new BrowserEngineError(`Unknown wait state '${state}'; expected one of ${WAIT_STATES.join(', ')}.`, {
          code: ErrorCode.INVALID_ARGUMENT,
          recoverable: false,
          context: { state }
        });
    }
  }

  /**
   * The parent of the first match.
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {DomElement|null}
   */
  parentOf(selector, { root = null } = {}) {
    const node = this.selectorEngine.queryFirst(selector, root);
    const parent = node?.parentElement ?? null;
    return parent ? this.describe(parent, {}) : null;
  }

  /**
   * The element children of the first match. Text nodes are excluded — this layer describes
   * elements, and a caller wanting text has `readText`.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {DomElement[]}
   */
  childrenOf(selector, { root = null } = {}) {
    const node = this.selectorEngine.queryFirst(selector, root);
    return Array.from(node?.children ?? []).map((child) => this.describe(child, {}));
  }

  /**
   * Convert a live node into a `DomElement`.
   *
   * The one place a node becomes data. Everything the model exposes is read here, so a
   * caller never needs the node itself.
   *
   * Both markup and form values are opt-in. A control's value is whatever the user typed —
   * name, email, resume text — and a `DomElement` is serialized into workflow state and
   * into snapshots under `v2/data/`, so capturing it by default would persist exactly the
   * data that must not be stored.
   *
   * @param {Element} node
   * @param {object} [options] `{ html, paths, values }`
   * @returns {DomElement}
   */
  describe(node, { html = false, paths = false, values = false } = {}) {
    const attributes = {};
    for (const attribute of Array.from(node.attributes ?? [])) attributes[attribute.name] = attribute.value;

    return new DomElement({
      tagName: (node.tagName ?? '').toLowerCase(),
      id: node.id || null,
      classList: Array.from(node.classList ?? []),
      attributes,
      text: (node.textContent ?? '').trim(),
      html: html ? node.innerHTML ?? null : null,
      boundingBox: this.validator.getBoundingBox(node),
      visible: this.validator.isVisible(node),
      enabled: this.validator.isEnabled(node),
      xpath: paths ? this.selectorEngine.getXPath(node) : null,
      cssPath: paths ? this.selectorEngine.getCssPath(node) : null,
      value: values ? node.value ?? null : null,
      ref: node
    });
  }
}

export { WaitState };

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default ElementFinder;
