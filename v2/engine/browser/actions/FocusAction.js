import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * Give an element keyboard focus.
 *
 * Focus is a precondition for the keyboard actions: `pressKey` and `pressShortcut` deliver
 * to whatever is focused, so a shortcut aimed at a specific field is `focus` then `pressKey`.
 *
 * `focus()` is called rather than a synthetic `focus` event, because the event alone does
 * not move the document's `activeElement` — the page would look focused while the keystrokes
 * went elsewhere.
 */
export class FocusAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Click });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params] `{ preventScroll }`
   * @returns {object} `{ selector, focused }` — `focused` reports whether the element
   *          actually became `activeElement`, which a disabled or unfocusable target will not.
   * @throws {ActionFailedError} `ACTION_FAILED` when the element exposes no `focus()`.
   */
  perform(element, { preventScroll = false } = {}) {
    const node = this.nodeOf(element);
    if (typeof node.focus !== 'function') {
      throw new ActionFailedError(`${element.describe()} cannot receive focus.`, { action: this.type, selector: element.describe() });
    }

    node.focus({ preventScroll });
    const active = this.dom.document?.activeElement ?? null;

    return { selector: element.describe(), focused: active === node };
  }
}

export default FocusAction;
