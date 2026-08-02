import { Action } from './Action.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * A single primary-button click.
 *
 * The full sequence is dispatched — `pointerdown`, `mousedown`, `mouseup`, `pointerup`,
 * `click` — not just `click`. Real pages listen at every stage: a menu that opens on
 * `mousedown` and a button that only enables after `pointerdown` both stay closed to a
 * lone `click` event.
 */
export class ClickAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Click });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params]
   * @param {boolean} [params.scrollIntoView] Bring the element into view first. On by
   *        default: a click carries coordinates, and an off-screen element's are outside
   *        the viewport.
   * @returns {object} `{ selector, cancelled }` — `cancelled` when a handler called
   *          `preventDefault` on the click, which is normal for links a page handles itself.
   */
  perform(element, { scrollIntoView = true } = {}) {
    const node = this.nodeOf(element);
    if (scrollIntoView && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    this.dispatchMouse(node, 'pointerdown', { button: 0 });
    this.dispatchMouse(node, 'mousedown', { button: 0, detail: 1 });
    this.dispatchMouse(node, 'mouseup', { button: 0, detail: 1 });
    this.dispatchMouse(node, 'pointerup', { button: 0 });
    const notCancelled = this.dispatchMouse(node, 'click', { button: 0, detail: 1 });

    return { selector: element.describe(), cancelled: !notCancelled };
  }
}

export default ClickAction;
