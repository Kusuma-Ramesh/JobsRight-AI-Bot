import { Action } from './Action.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * A secondary-button click.
 *
 * Dispatches `mousedown`/`mouseup` with `button: 2` and then `contextmenu`. Only a page's
 * own custom menu can result: the browser's native context menu is chrome UI and does not
 * open for a synthetic event, so an action must never wait for one.
 */
export class RightClickAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Click });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params] `{ scrollIntoView }`
   * @returns {object} `{ selector, cancelled }` — `cancelled` is true when the page called
   *          `preventDefault` on `contextmenu`, i.e. it is showing its own menu.
   */
  perform(element, { scrollIntoView = true } = {}) {
    const node = this.nodeOf(element);
    if (scrollIntoView && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    this.dispatchMouse(node, 'mousedown', { button: 2, buttons: 2 });
    this.dispatchMouse(node, 'mouseup', { button: 2, buttons: 0 });
    const notCancelled = this.dispatchMouse(node, 'contextmenu', { button: 2 });

    return { selector: element.describe(), cancelled: !notCancelled };
  }
}

export default RightClickAction;
