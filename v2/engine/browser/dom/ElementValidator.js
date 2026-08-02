/**
 * Judges the state of an element: is it rendered, is it enabled, could it be acted on?
 *
 * Kept separate from finding, because "not found" and "found but invisible" are different
 * failures with different fixes, and a layer that conflates them produces the worst kind of
 * automation bug — one that reports the wrong cause. `ElementFinder` answers *whether* an
 * element is there; this file answers *what state it is in*.
 *
 * Reporting only. It never makes an element visible, enabled, or scrolled into view.
 */
export class ElementValidator {
  /**
   * @param {object} [options]
   * @param {object} [options.window] Window used for computed styles and viewport size.
   *                                  Defaults to the page's own; injected in tests.
   */
  constructor({ window = null } = {}) {
    this.window = window ?? globalThis.window ?? null;
  }

  /**
   * Whether an element is rendered and could be seen.
   *
   * Checks the three independent ways an element disappears: layout (`display: none`
   * removes the box entirely), painting (`visibility`, `opacity`), and geometry (a
   * zero-area box). Any one of them is enough to hide it, so all three are required.
   *
   * Being scrolled out of view is *not* counted as invisible — the element is rendered and
   * a later phase can scroll to it. `isInViewport` answers that question separately.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isVisible(element) {
    if (!element) return false;

    // `offsetParent` is null for `display: none` subtrees, and cheap; but it is also null
    // for `position: fixed`, so a null result must be confirmed against the box.
    const box = this.getBoundingBox(element);
    if (!box || box.width <= 0 || box.height <= 0) return false;

    const style = this.getComputedStyle(element);
    if (!style) return true;
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (Number.parseFloat(style.opacity ?? '1') === 0) return false;
    return true;
  }

  /**
   * Whether the element accepts input: not `disabled`, not `aria-disabled`, not
   * `readonly`.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isEnabled(element) {
    if (!element) return false;
    if (element.disabled === true) return false;
    if (element.getAttribute?.('aria-disabled') === 'true') return false;
    if (element.hasAttribute?.('readonly')) return false;
    return true;
  }

  /**
   * Whether the element is currently inside the viewport.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isInViewport(element) {
    const box = this.getBoundingBox(element);
    if (!box || !this.window) return false;
    const height = this.window.innerHeight ?? 0;
    const width = this.window.innerWidth ?? 0;
    return box.bottom > 0 && box.right > 0 && box.top < height && box.left < width;
  }

  /**
   * Whether a later interaction phase could act on this element: visible and enabled.
   *
   * The judgement is made here and merely *reported*; this layer performs no interaction.
   *
   * @param {Element} element
   * @returns {boolean}
   */
  isInteractable(element) {
    return this.isVisible(element) && this.isEnabled(element);
  }

  /**
   * A full, explainable verdict.
   *
   * Returns the individual checks rather than a single boolean, so a failure can say *why*
   * — "found, but hidden by opacity" is actionable in a way that "not interactable" is not.
   *
   * @param {Element} element
   * @returns {{ exists: boolean, visible: boolean, enabled: boolean, inViewport: boolean, interactable: boolean, reason: string|null }}
   */
  inspect(element) {
    const exists = Boolean(element);
    const visible = exists && this.isVisible(element);
    const enabled = exists && this.isEnabled(element);
    const inViewport = exists && this.isInViewport(element);
    const interactable = visible && enabled;

    let reason = null;
    if (!exists) reason = 'Element is not present in the document.';
    else if (!visible) reason = 'Element is present but not rendered (display, visibility, opacity, or zero area).';
    else if (!enabled) reason = 'Element is visible but disabled or read-only.';

    return { exists, visible, enabled, inViewport, interactable, reason };
  }

  /**
   * Bounding box as a plain object, or null when the element reports none.
   *
   * @param {Element} element
   * @returns {{ x: number, y: number, width: number, height: number, top: number, left: number, bottom: number, right: number }|null}
   */
  getBoundingBox(element) {
    if (typeof element?.getBoundingClientRect !== 'function') return null;
    const rect = element.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: rect.x ?? rect.left,
      y: rect.y ?? rect.top,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    };
  }

  /**
   * Computed style for an element, or null when styles are unavailable (a detached node,
   * or a test document without a window).
   *
   * @param {Element} element
   * @returns {CSSStyleDeclaration|object|null}
   */
  getComputedStyle(element) {
    if (typeof this.window?.getComputedStyle !== 'function') return null;
    try {
      return this.window.getComputedStyle(element);
    } catch {
      return null;
    }
  }
}

export default ElementValidator;
