import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * Scroll the window, or a scrollable container, by an offset.
 *
 * Page-level: it takes no selector unless a container is named. Its main use is driving
 * infinite lists, where content only loads once the viewport moves — so the resulting scroll
 * position is reported, letting a caller detect that the page did not move and stop.
 */
export class ScrollAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Scroll });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement|null} element Container, or null
   *        for the window.
   * @param {object} params
   * @param {number} [params.x] Horizontal offset in pixels.
   * @param {number} [params.y] Vertical offset in pixels.
   * @param {string} [params.behavior] `'auto'` (default) or `'smooth'`. `'auto'` is used
   *        deliberately: a smooth scroll has not finished when the call returns.
   * @returns {object} `{ x, y, moved }` — the position after scrolling, and whether it changed.
   * @throws {ActionFailedError} `ACTION_FAILED` when there is nothing that can scroll.
   */
  perform(element, { x = 0, y = 0, behavior = 'auto' } = {}) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new ActionFailedError('scrollBy requires finite x and y offsets.', { action: this.type, x, y });
    }

    if (element) {
      const node = this.nodeOf(element);
      const before = { x: node.scrollLeft ?? 0, y: node.scrollTop ?? 0 };
      if (typeof node.scrollBy === 'function') node.scrollBy({ left: x, top: y, behavior });
      else {
        node.scrollLeft = before.x + x;
        node.scrollTop = before.y + y;
      }
      const after = { x: node.scrollLeft ?? 0, y: node.scrollTop ?? 0 };
      return { x: after.x, y: after.y, moved: after.x !== before.x || after.y !== before.y };
    }

    const window = this.window;
    if (!window || typeof window.scrollBy !== 'function') {
      throw new ActionFailedError('No scrollable window is available.', { action: this.type });
    }

    const before = { x: window.scrollX ?? 0, y: window.scrollY ?? 0 };
    window.scrollBy({ left: x, top: y, behavior });
    const after = { x: window.scrollX ?? 0, y: window.scrollY ?? 0 };

    return { x: after.x, y: after.y, moved: after.x !== before.x || after.y !== before.y };
  }

  /** @returns {string} */
  describe(element, params) {
    return `${this.type} by (${params.x ?? 0}, ${params.y ?? 0})`;
  }
}

export default ScrollAction;
