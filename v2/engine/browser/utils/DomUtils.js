import { NotImplementedError } from './Errors.js';

/**
 * Pure DOM helpers used by the engine when it runs inside a page context.
 *
 * These are the lowest-level primitives in the engine: no waiting, no retrying, no logging,
 * no site knowledge. Everything here takes an already-resolved selector string and answers
 * a single question about the live DOM. Anything that needs to *wait* belongs in
 * `PageManager` or `TimeoutService`, not here.
 */
export const DomUtils = {
  /**
   * Find the first element matching a selector.
   * @param {string} selector
   * @param {ParentNode} [root]
   * @returns {Element|null}
   */
  query(selector, root) {
    // TODO: implement `root.querySelector(selector)` with a null-safe root default.
    throw new NotImplementedError('DomUtils.query');
  },

  /**
   * Find every element matching a selector.
   * @param {string} selector
   * @param {ParentNode} [root]
   * @returns {Element[]}
   */
  queryAll(selector, root) {
    // TODO: implement, returning a real array rather than a live NodeList.
    throw new NotImplementedError('DomUtils.queryAll');
  },

  /**
   * Whether an element exists and is actually perceivable by a user.
   * Must account for zero size, `display: none`, `visibility`, and `opacity`.
   * @param {Element} element
   * @returns {boolean}
   */
  isVisible(element) {
    // TODO: implement using bounding rect plus computed style.
    throw new NotImplementedError('DomUtils.isVisible');
  },

  /**
   * Whether an element can receive input: visible, enabled, not `aria-disabled`,
   * and not covered by another element at its centre point.
   * @param {Element} element
   * @returns {boolean}
   */
  isInteractable(element) {
    // TODO: implement, including the `elementFromPoint` occlusion check.
    throw new NotImplementedError('DomUtils.isInteractable');
  },

  /**
   * Normalized visible text of an element.
   * @param {Element} element
   * @returns {string}
   */
  getText(element) {
    // TODO: implement, collapsing whitespace and trimming.
    throw new NotImplementedError('DomUtils.getText');
  },

  /**
   * Read a single attribute.
   * @param {Element} element
   * @param {string} attribute
   * @returns {string|null}
   */
  getAttribute(element, attribute) {
    // TODO: implement.
    throw new NotImplementedError('DomUtils.getAttribute');
  },

  /**
   * Bring an element into the viewport.
   * @param {Element} element
   * @param {object} [options]
   * @returns {void}
   */
  scrollIntoView(element, options) {
    // TODO: implement; prefer centring the element to avoid sticky headers.
    throw new NotImplementedError('DomUtils.scrollIntoView');
  },

  /**
   * Dispatch the sequence of events a real user interaction produces, so frameworks
   * that listen for `input`/`change` observe the value change.
   * @param {Element} element
   * @param {string[]} eventNames
   * @returns {void}
   */
  dispatchEvents(element, eventNames) {
    // TODO: implement with bubbling, composed events.
    throw new NotImplementedError('DomUtils.dispatchEvents');
  }
};

export default DomUtils;
