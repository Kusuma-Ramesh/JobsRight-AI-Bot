import { ActivityResult } from './../../../workflow/activities/ActivityResult.js';
import { Selector } from './../models/Selector.js';
import { WaitState } from './../dom/WaitState.js';
import {
  ActionFailedError,
  BrowserEngineError,
  ElementNotFoundError,
  ElementNotInteractableError,
  ErrorCode
} from './../utils/Errors.js';

/**
 * Shared behavior for every browser action.
 *
 * Not in the phase's file list, but every action needs the same three things and getting
 * them subtly different per action is exactly how an automation layer becomes unreliable:
 *
 * 1. **Resolve and validate before touching anything.** No action performs an interaction
 *    on an element whose state was never checked.
 * 2. **Distinguish the two failures.** "Never appeared" and "appeared but was hidden or
 *    disabled" have different causes and different fixes, so they surface as
 *    `ELEMENT_NOT_FOUND` and `ELEMENT_NOT_INTERACTABLE`, never as one generic failure.
 * 3. **Never throw.** Every action returns an `ActivityResult`. An action is an activity's
 *    unit of work, and the workflow engine decides to retry or abort by reading a result's
 *    `error.code` and `error.recoverable` — not by catching exceptions.
 *
 * Subclasses implement `perform`, and nothing else.
 */
export class Action {
  /**
   * @param {object} options
   * @param {import('./../dom/DomEngine.js').DomEngine} options.dom
   * @param {string} options.type   The `ActivityType` this action implements.
   * @param {object} [options.window] Window for scrolling and event construction.
   * @param {number} [options.timeout] Default wait for the element, in milliseconds.
   */
  constructor({ dom, type, window = null, timeout = 10000 }) {
    this.dom = dom;
    this.type = type;
    this.window = window ?? dom?.window ?? globalThis.window ?? null;
    this.timeout = timeout;
  }

  /**
   * The state the target must reach before this action runs. Overridden by actions with a
   * weaker requirement — `hover` and `scrollTo` need a rendered element, not an enabled
   * one, and refusing to scroll to a disabled element would be wrong.
   *
   * @returns {string} A `WaitState` value.
   */
  get requiredState() {
    return WaitState.Interactable;
  }

  /**
   * Perform the interaction. Implemented by each action.
   *
   * @param {import('./../models/DomElement.js').DomElement|null} element Resolved target,
   *        or null for an action that has no element (`scrollBy`, `pressKey`).
   * @param {object} params Action-specific parameters.
   * @returns {Promise<object>|object} Payload describing what happened.
   */
  // eslint-disable-next-line no-unused-vars
  perform(element, params) {
    throw new ActionFailedError(`${this.constructor.name} does not implement perform().`);
  }

  /**
   * Run the action: resolve, validate, perform, and wrap the outcome.
   *
   * @param {object} [params]
   * @param {Selector|object|string} [params.selector] Target. Omitted by page-level actions.
   * @param {number} [params.timeout] Override the element wait, in milliseconds.
   * @param {string} [params.state]   Override the required `WaitState`.
   * @returns {Promise<ActivityResult>} Always a result; never throws.
   */
  async run(params = {}) {
    const started = Date.now();
    try {
      const element = params.selector === undefined ? null : await this.resolve(params);
      const payload = await this.perform(element, params);
      return ActivityResult.success({
        message: this.describe(element, params),
        duration: Date.now() - started,
        payload: { action: this.type, ...payload }
      });
    } catch (error) {
      return this.toFailure(error, started, params);
    }
  }

  /**
   * Wait for the target and confirm it can be acted on.
   *
   * Two waits rather than one: the first establishes whether the element ever appeared, the
   * second whether it reached a usable state. A single combined wait would report both as a
   * timeout and lose the distinction that makes a failure diagnosable.
   *
   * @param {object} params `{ selector, timeout, state }`
   * @returns {Promise<import('./../models/DomElement.js').DomElement>}
   * @throws {ElementNotFoundError|ElementNotInteractableError|BrowserEngineError}
   */
  async resolve({ selector, timeout = null, state = null }) {
    const budget = timeout ?? this.timeout;
    const label = String(Selector.from(selector));
    const deadline = Date.now() + budget;

    try {
      await this.dom.waitForElement(selector, { timeout: budget, state: WaitState.Present });
    } catch (error) {
      if (error.code === ErrorCode.TIMEOUT) {
        throw new ElementNotFoundError(`No element matched ${label} within ${budget}ms.`, { selector: label, timeout: budget });
      }
      throw error;
    }

    const required = state ?? this.requiredState;
    if (required === WaitState.Present) return this.dom.findElement(selector, { required: true });

    try {
      return await this.dom.waitForElement(selector, { timeout: Math.max(0, deadline - Date.now()), state: required });
    } catch (error) {
      if (error.code !== ErrorCode.TIMEOUT) throw error;
      const verdict = this.dom.inspectElement(selector);
      throw new ElementNotInteractableError(`${label} was found but never became ${required}. ${verdict.reason ?? ''}`.trim(), {
        selector: label,
        state: required,
        verdict
      });
    }
  }

  /**
   * Convert a thrown error into a failed `ActivityResult`.
   *
   * An unexpected error is wrapped as `ACTION_FAILED` rather than passed through raw, so a
   * caller can always read `error.code` and `error.recoverable`.
   *
   * @param {unknown} error
   * @param {number} started Timestamp the run began.
   * @param {object} params
   * @returns {ActivityResult}
   */
  toFailure(error, started, params) {
    const engineError =
      error instanceof BrowserEngineError
        ? error
        : new ActionFailedError(`${this.type} failed: ${error?.message ?? String(error)}`, { action: this.type, cause: error?.name ?? null });

    return ActivityResult.failure({
      message: engineError.message,
      duration: Date.now() - started,
      error: engineError.toJSON(),
      payload: { action: this.type, selector: params.selector === undefined ? null : String(Selector.from(params.selector)) }
    });
  }

  /**
   * One-line description of a successful run, used as the result message.
   *
   * @param {import('./../models/DomElement.js').DomElement|null} element
   * @param {object} params
   * @returns {string}
   */
  describe(element, params) {
    const target = element ? element.describe() : params.selector === undefined ? 'page' : String(Selector.from(params.selector));
    return `${this.type} on ${target}`;
  }

  /**
   * The live node behind a resolved element.
   *
   * Actions are the one layer allowed to reach through to the node: the DOM engine hands
   * back data by design, and an interaction has nothing to act on without the node itself.
   *
   * @param {import('./../models/DomElement.js').DomElement} element
   * @returns {Element}
   * @throws {ActionFailedError} When the description carries no live reference, which means
   *         it crossed a serialization boundary and can no longer be acted on.
   */
  nodeOf(element) {
    if (!element?.ref) {
      throw new ActionFailedError('The resolved element carries no live reference; it cannot be acted on.', { action: this.type });
    }
    return element.ref;
  }

  /**
   * Dispatch a synthetic mouse event.
   *
   * Events are dispatched as trusted-shaped as page JavaScript allows: bubbling,
   * cancelable, with coordinates taken from the element's box, because frameworks routinely
   * ignore an event that carries no position. They remain untrusted (`isTrusted === false`)
   * — nothing in a content script can change that.
   *
   * @param {Element} node
   * @param {string} eventType
   * @param {object} [init] Extra event properties.
   * @returns {boolean} Whether the event was not cancelled.
   */
  dispatchMouse(node, eventType, init = {}) {
    const box = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
    const MouseEventCtor = this.window?.MouseEvent;
    const detail = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: this.window ?? undefined,
      clientX: box ? box.left + box.width / 2 : 0,
      clientY: box ? box.top + box.height / 2 : 0,
      ...init
    };
    const event = typeof MouseEventCtor === 'function' ? new MouseEventCtor(eventType, detail) : { type: eventType, ...detail };
    return node.dispatchEvent(event);
  }

  /**
   * Dispatch a synthetic keyboard event.
   *
   * @param {EventTarget} target
   * @param {string} eventType `'keydown'`, `'keyup'`, or `'keypress'`.
   * @param {object} init `{ key, code, ctrlKey, ... }`
   * @returns {boolean} Whether the event was not cancelled.
   */
  dispatchKey(target, eventType, init = {}) {
    const KeyboardEventCtor = this.window?.KeyboardEvent;
    const detail = { bubbles: true, cancelable: true, composed: true, view: this.window ?? undefined, ...init };
    const event = typeof KeyboardEventCtor === 'function' ? new KeyboardEventCtor(eventType, detail) : { type: eventType, ...detail };
    return target.dispatchEvent(event);
  }

  /**
   * Dispatch a plain event by name (`input`, `change`, `focus`, ...).
   *
   * @param {EventTarget} target
   * @param {string} eventType
   * @param {object} [init]
   * @returns {boolean}
   */
  dispatchEvent(target, eventType, init = {}) {
    const EventCtor = this.window?.Event;
    const detail = { bubbles: true, cancelable: false, composed: true, ...init };
    const event = typeof EventCtor === 'function' ? new EventCtor(eventType, detail) : { type: eventType, ...detail };
    return target.dispatchEvent(event);
  }
}

export default Action;
