import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/**
 * Type into an input, textarea, or contenteditable element.
 *
 * Assigning `node.value` directly is not enough on any modern page. React and friends
 * install their own `value` setter on the element instance and track the last value they
 * wrote; a plain assignment updates the DOM but leaves the framework's state stale, so the
 * field visibly contains text the application does not believe is there — and the form
 * submits empty. The value is therefore written through the *prototype's* native setter,
 * then `input` and `change` are dispatched, which is what a framework listens for.
 *
 * Per-character key events are dispatched only when asked (`perKey`). They are what an
 * autocomplete or a search-as-you-type field needs, and pure overhead otherwise.
 */
export class TypeTextAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Type });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement} element
   * @param {object} params
   * @param {string} params.value    Text to write. Never logged: it is user data.
   * @param {boolean} [params.append] Keep the existing content and add to it.
   * @param {boolean} [params.perKey] Also dispatch `keydown`/`keyup` per character.
   * @param {boolean} [params.blur]   Dispatch `blur` afterwards, which is what triggers
   *                                  validation on many forms. On by default.
   * @returns {object} `{ selector, length, appended }` — the length, never the text.
   * @throws {ActionFailedError} `ACTION_FAILED` when the target accepts no text at all.
   */
  perform(element, { value, append = false, perKey = false, blur = true } = {}) {
    if (typeof value !== 'string') {
      throw new ActionFailedError('typeText requires a string value.', { action: this.type });
    }

    const node = this.nodeOf(element);
    const editable = node.isContentEditable === true;
    if (!editable && typeof node.value !== 'string') {
      throw new ActionFailedError(`${element.describe()} does not accept text input.`, { action: this.type, selector: element.describe() });
    }

    if (typeof node.focus === 'function') node.focus();

    const next = append ? `${(editable ? node.textContent : node.value) ?? ''}${value}` : value;

    if (editable) {
      node.textContent = next;
    } else {
      this.setNativeValue(node, next);
    }

    if (perKey) {
      for (const character of value) {
        this.dispatchKey(node, 'keydown', { key: character });
        this.dispatchKey(node, 'keyup', { key: character });
      }
    }

    this.dispatchEvent(node, 'input');
    this.dispatchEvent(node, 'change');
    if (blur && typeof node.blur === 'function') node.blur();

    return { selector: element.describe(), length: value.length, appended: append };
  }

  /**
   * Write a value through the native prototype setter so framework value-tracking sees it.
   *
   * @param {Element} node
   * @param {string} value
   */
  setNativeValue(node, value) {
    const prototype = Object.getPrototypeOf(node);
    const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value') : null;

    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(node, value);
      return;
    }
    node.value = value;
  }
}

export default TypeTextAction;
