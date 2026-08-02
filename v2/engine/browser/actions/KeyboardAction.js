import { Action } from './Action.js';
import { ActionFailedError } from './../utils/Errors.js';
import { ActivityType } from './../../../workflow/activities/ActivityType.js';

/** Modifier names accepted in a shortcut, mapped to their `KeyboardEvent` flags. */
export const MODIFIER_FLAGS = Object.freeze({
  ctrl: 'ctrlKey',
  control: 'ctrlKey',
  alt: 'altKey',
  option: 'altKey',
  shift: 'shiftKey',
  meta: 'metaKey',
  cmd: 'metaKey',
  command: 'metaKey'
});

/**
 * Send keystrokes to the focused element.
 *
 * Delivery follows focus, exactly as a real keyboard does: with no target selector the
 * events go to `document.activeElement`, so the caller controls the destination with
 * `focus()`. Passing a selector focuses it first.
 *
 * **A synthetic key event does not produce its default effect.** `Enter` will not submit a
 * form, `Tab` will not move focus, and a printable key will not insert a character — the
 * browser reserves that for trusted input. What does work is every JavaScript handler bound
 * to the key, which is how single-page applications implement their shortcuts. Use
 * `typeText` to enter text, and click a submit control rather than pressing `Enter` on it.
 */
export class KeyboardAction extends Action {
  constructor(options) {
    super({ ...options, type: ActivityType.Type });
  }

  /**
   * @param {import('./../models/DomElement.js').DomElement|null} element Focus target, or
   *        null to send to whatever is currently focused.
   * @param {object} params
   * @param {string} [params.key]    A single key, e.g. `'Enter'`, `'Escape'`, `'a'`.
   * @param {string[]|string} [params.keys] A shortcut: `['Control', 'Enter']` or
   *        `'Control+Enter'`. The last entry is the key; everything before it is a modifier.
   * @param {boolean} [params.repeatable] Dispatch `keypress` too, for a printable key.
   * @returns {object} `{ key, modifiers, defaultPrevented }` — `defaultPrevented` is the
   *          signal that a page handler actually acted on the keystroke.
   * @throws {ActionFailedError} `ACTION_FAILED` for an empty or unparseable key.
   */
  perform(element, { key = null, keys = null, repeatable = false } = {}) {
    const { mainKey, modifiers } = this.parse(key, keys);
    const node = element ? this.nodeOf(element) : null;
    if (node && typeof node.focus === 'function') node.focus();

    const target = node ?? this.dom.document?.activeElement ?? this.dom.document?.body ?? this.dom.document;
    if (!target || typeof target.dispatchEvent !== 'function') {
      throw new ActionFailedError('No focused element is available to receive the keystroke.', { action: this.type, key: mainKey });
    }

    const init = { key: mainKey, code: this.codeFor(mainKey), ...modifiers };
    const notCancelled = this.dispatchKey(target, 'keydown', init);
    if (repeatable) this.dispatchKey(target, 'keypress', init);
    this.dispatchKey(target, 'keyup', init);

    return { key: mainKey, modifiers: Object.keys(modifiers), defaultPrevented: !notCancelled };
  }

  /**
   * Split a key or shortcut into its main key and modifier flags.
   *
   * @param {string|null} key
   * @param {string[]|string|null} keys
   * @returns {{ mainKey: string, modifiers: object }}
   * @throws {ActionFailedError} `ACTION_FAILED` when neither form yields a key.
   */
  parse(key, keys) {
    const parts = keys === null ? [key] : Array.isArray(keys) ? [...keys] : String(keys).split('+');
    const cleaned = parts.filter((part) => typeof part === 'string' && part.trim() !== '').map((part) => part.trim());

    if (cleaned.length === 0) {
      throw new ActionFailedError('pressKey requires a key name.', { action: this.type });
    }

    const mainKey = cleaned[cleaned.length - 1];
    const modifiers = {};
    for (const part of cleaned.slice(0, -1)) {
      const flag = MODIFIER_FLAGS[part.toLowerCase()];
      if (!flag) throw new ActionFailedError(`Unknown modifier '${part}'.`, { action: this.type, modifier: part });
      modifiers[flag] = true;
    }

    return { mainKey, modifiers };
  }

  /**
   * Best-effort `KeyboardEvent.code` for a key name. Handlers that read `code` instead of
   * `key` are common enough that omitting it breaks them.
   *
   * @param {string} key
   * @returns {string}
   */
  codeFor(key) {
    if (key.length === 1) {
      if (/[a-z]/i.test(key)) return `Key${key.toUpperCase()}`;
      if (/[0-9]/.test(key)) return `Digit${key}`;
      return '';
    }
    return key;
  }

  /** @returns {string} */
  describe(element, params) {
    const { mainKey, modifiers } = this.parse(params.key ?? null, params.keys ?? null);
    return `Press ${[...Object.keys(modifiers), mainKey].join('+')}`;
  }
}

export default KeyboardAction;
