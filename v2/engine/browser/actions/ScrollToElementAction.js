import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';
import { WaitState } from './../dom/WaitState.js';

/**
 * Bring an element into view.
 *
 * Requires only that the element be rendered, not interactable: scrolling to a disabled
 * control to read or screenshot it is legitimate, and demanding interactability would refuse
 * it for no reason.
 *
 * The element's viewport position is reported afterwards, because `scrollIntoView` cannot
 * always succeed — an element inside a container that is itself clipped may not reach the
 * viewport, and a caller that assumes it did will act on the wrong coordinates.
 */
export class ScrollToElementAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Scroll });
  }

  /** @returns {string} */
  get requiredState() {
    return WaitState.Visible;
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params]
   * @param {string} [params.block]  Vertical alignment; `'center'` by default, which keeps
   *        the target clear of sticky headers and footers.
   * @param {string} [params.inline] Horizontal alignment; `'nearest'` by default.
   * @returns {object} `{ selector, inViewport, boundingBox }`
   * @throws {ActionFailedError} `ACTION_FAILED` when the element cannot be scrolled to.
   */
  perform(element, { block = 'center', inline = 'nearest' } = {}) {
    const node = this.nodeOf(element);
    if (typeof node.scrollIntoView !== 'function') {
      throw new ActionFailedError(`${element.describe()} cannot be scrolled into view.`, { action: this.type, selector: element.describe() });
    }

    node.scrollIntoView({ block, inline, behavior: 'auto' });

    return {
      selector: element.describe(),
      inViewport: this.dom.validator.isInViewport(node),
      boundingBox: this.dom.validator.getBoundingBox(node)
    };
  }
}

export default ScrollToElementAction;
