import { Action } from './Action.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';
import { WaitState } from './../dom/WaitState.js';

/**
 * Move the pointer onto an element.
 *
 * Its real purpose is revealing what only exists on hover — dropdown menus, overflow
 * actions, tooltips — so the sequence includes `pointerover`/`mouseover` and `mousemove`,
 * not just `mouseenter`. CSS `:hover` itself cannot be triggered by a synthetic event;
 * anything that depends purely on CSS will not open, and only a JavaScript-driven menu will.
 */
export class HoverAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Click });
  }

  /**
   * Hovering needs a rendered element, not an enabled one: a disabled control can still
   * show a tooltip explaining why it is disabled.
   * @returns {string}
   */
  get requiredState() {
    return WaitState.Visible;
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params] `{ scrollIntoView }`
   * @returns {object} `{ selector }`
   */
  perform(element, { scrollIntoView = true } = {}) {
    const node = this.nodeOf(element);
    if (scrollIntoView && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    this.dispatchMouse(node, 'pointerover');
    this.dispatchMouse(node, 'mouseover');
    this.dispatchMouse(node, 'mouseenter', { bubbles: false });
    this.dispatchMouse(node, 'mousemove');

    return { selector: element.describe() };
  }
}

export default HoverAction;
