import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';
import { TypeTextAction } from './TypeTextAction.js';
import { WaitState } from './../dom/WaitState.js';

/**
 * Empty an input, textarea, or contenteditable element.
 *
 * Clearing is typing an empty string, so it goes through the same native setter and fires
 * the same `input`/`change` pair. A field cleared without those events looks empty while the
 * application still holds the old value.
 *
 * The previous contents are returned only as a length. They are user data, and a cleared
 * field is exactly the kind of place a resume or a phone number sits.
 */
export class ClearInputAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Type });
    this.typeText = new TypeTextAction(options);
  }

  /**
   * Clearing writes to the field, so a read-only control is a genuine blocker here.
   * @returns {string}
   */
  get requiredState() {
    return WaitState.Interactable;
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} [params] `{ blur }`
   * @returns {object} `{ selector, clearedLength }`
   * @throws {ActionFailedError} `ACTION_FAILED` when the target holds no editable value.
   */
  perform(element, { blur = true } = {}) {
    const node = this.nodeOf(element);
    const editable = node.isContentEditable === true;
    if (!editable && typeof node.value !== 'string') {
      throw new ActionFailedError(`${element.describe()} holds no value to clear.`, { action: this.type, selector: element.describe() });
    }

    const clearedLength = ((editable ? node.textContent : node.value) ?? '').length;
    this.typeText.perform(element, { value: '', append: false, blur });

    return { selector: element.describe(), clearedLength };
  }
}

export default ClearInputAction;
