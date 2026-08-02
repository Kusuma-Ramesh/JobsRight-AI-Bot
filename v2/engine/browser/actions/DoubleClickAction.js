import { Action } from './Action.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * A double click.
 *
 * Two full click sequences with an incrementing `detail` followed by `dblclick`, which is
 * what a browser produces. Dispatching `dblclick` alone would miss every handler bound to
 * the underlying clicks.
 */
export class DoubleClickAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Click });
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

    for (const detail of [1, 2]) {
      this.dispatchMouse(node, 'mousedown', { button: 0, detail });
      this.dispatchMouse(node, 'mouseup', { button: 0, detail });
      this.dispatchMouse(node, 'click', { button: 0, detail });
    }
    this.dispatchMouse(node, 'dblclick', { button: 0, detail: 2 });

    return { selector: element.describe() };
  }
}

export default DoubleClickAction;
