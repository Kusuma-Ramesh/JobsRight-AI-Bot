import { ClearInputAction } from './ClearInputAction.js';
import { ClickAction } from './ClickAction.js';
import { DomEngine } from './../dom/DomEngine.js';
import { DoubleClickAction } from './DoubleClickAction.js';
import { FocusAction } from './FocusAction.js';
import { HoverAction } from './HoverAction.js';
import { KeyboardAction } from './KeyboardAction.js';
import { RightClickAction } from './RightClickAction.js';
import { ScrollAction } from './ScrollAction.js';
import { ScrollToElementAction } from './ScrollToElementAction.js';
import { TypeTextAction } from './TypeTextAction.js';
import { UploadFileAction } from './UploadFileAction.js';

/** Default wait for a target to become actionable, in milliseconds. */
export const DEFAULT_ACTION_TIMEOUT = 10000;

/**
 * The interaction layer's façade: everything that changes the page.
 *
 * Read and write are separate engines on purpose. `DomEngine` is safe to call at any point
 * in a run because it only observes; every method here has a side effect on the page, and
 * keeping that in one place makes "what can this code do to the browser?" answerable by
 * looking at a single directory.
 *
 * Three properties hold for every method:
 *
 * - **Nothing is touched unsighted.** Each action waits for its target and confirms the
 *   state it needs before interacting — `Interactable` for a click or a keystroke, `Visible`
 *   for a hover or a scroll, mere `Present` for a file input, which is usually hidden.
 * - **Nothing throws.** Every method resolves to an `ActivityResult`, the same value an
 *   activity returns, carrying `success`, a duration, a structured `error` with a stable
 *   code, and a payload. The workflow engine reads that; it does not catch exceptions.
 * - **Nothing is site-specific.** This engine has no selectors and no knowledge of any
 *   application. Callers supply locators; controllers hold the intent.
 *
 * Dependencies point one way — Browser Runtime, DOM Engine, Activity Framework — and it
 * imports nothing from the workflow engine, the runtime, or any adapter.
 */
export class ActionEngine {
  /**
   * @param {object} [options]
   * @param {DomEngine} [options.dom]   Reused if supplied, so a caller can share one engine.
   * @param {Document} [options.document]
   * @param {object} [options.window]
   * @param {number} [options.timeout]  Default wait for a target, in milliseconds.
   * @param {object} [options.logger]
   */
  constructor({ dom = null, document = null, window = null, timeout = DEFAULT_ACTION_TIMEOUT, logger = null } = {}) {
    this.dom = dom ?? new DomEngine({ document, window });
    this.window = window ?? this.dom.window ?? globalThis.window ?? null;
    this.timeout = timeout;
    this.logger = logger;

    const shared = { dom: this.dom, window: this.window, timeout };
    this.actions = Object.freeze({
      click: new ClickAction(shared),
      doubleClick: new DoubleClickAction(shared),
      rightClick: new RightClickAction(shared),
      hover: new HoverAction(shared),
      focus: new FocusAction(shared),
      typeText: new TypeTextAction(shared),
      clearInput: new ClearInputAction(shared),
      uploadFile: new UploadFileAction(shared),
      scroll: new ScrollAction(shared),
      scrollToElement: new ScrollToElementAction(shared),
      keyboard: new KeyboardAction(shared)
    });
  }

  // ── Pointer ────────────────────────────────────────────────────────────────

  /**
   * Click an element.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector CSS or XPath.
   * @param {object} [options] `{ timeout, state, scrollIntoView }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          Failure codes: `ELEMENT_NOT_FOUND`, `ELEMENT_NOT_INTERACTABLE`,
   *          `INVALID_ARGUMENT`, `ACTION_FAILED`.
   */
  click(selector, options = {}) {
    return this.actions.click.run({ selector, ...options });
  }

  /**
   * Double-click an element.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, scrollIntoView }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  doubleClick(selector, options = {}) {
    return this.actions.doubleClick.run({ selector, ...options });
  }

  /**
   * Right-click an element, opening a page's own context menu if it has one.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, scrollIntoView }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  rightClick(selector, options = {}) {
    return this.actions.rightClick.run({ selector, ...options });
  }

  /**
   * Hover an element, revealing anything shown on hover by JavaScript.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, scrollIntoView }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  hover(selector, options = {}) {
    return this.actions.hover.run({ selector, ...options });
  }

  /**
   * Give an element keyboard focus.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, preventScroll }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          The payload's `focused` reports whether focus actually landed.
   */
  focus(selector, options = {}) {
    return this.actions.focus.run({ selector, ...options });
  }

  // ── Text ───────────────────────────────────────────────────────────────────

  /**
   * Replace a field's contents.
   *
   * The value is written through the native setter and followed by `input` and `change`, so
   * a framework-managed form registers it. The text itself never appears in the result: only
   * its length, because it is user data.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {string} value
   * @param {object} [options] `{ timeout, state, perKey, blur }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  typeText(selector, value, options = {}) {
    return this.actions.typeText.run({ selector, value, append: false, ...options });
  }

  /**
   * Add to a field's existing contents.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {string} value
   * @param {object} [options] `{ timeout, state, perKey, blur }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  appendText(selector, value, options = {}) {
    return this.actions.typeText.run({ selector, value, append: true, ...options });
  }

  /**
   * Empty a field, firing the events a framework needs to see.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, blur }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          The payload reports `clearedLength`, never the previous text.
   */
  clearInput(selector, options = {}) {
    return this.actions.clearInput.run({ selector, ...options });
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  /**
   * Attach a file to a file input.
   *
   * A path alone cannot work — a page cannot read the filesystem — so pass the file itself
   * or its bytes, read in the extension's background context. A path is accepted only so the
   * failure says exactly that.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {File|Blob|string|object} fileOrPath A `File`/`Blob`, a path (which fails with a
   *        clear message), or `{ content, fileName, mimeType }`.
   * @param {object} [options] `{ timeout, state }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          Failure code `UPLOAD_FAILED` when the file cannot be attached.
   */
  uploadFile(selector, fileOrPath, options = {}) {
    return this.actions.uploadFile.run({ selector, ...toUploadParams(fileOrPath), ...options });
  }

  // ── Scrolling ──────────────────────────────────────────────────────────────

  /**
   * Scroll an element into view.
   *
   * @param {import('./../models/Selector.js').Selector|object|string} selector
   * @param {object} [options] `{ timeout, state, block, inline }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          The payload's `inViewport` confirms the element actually arrived.
   */
  scrollTo(selector, options = {}) {
    return this.actions.scrollToElement.run({ selector, ...options });
  }

  /**
   * Scroll the window, or a container, by an offset.
   *
   * @param {number} x Horizontal pixels.
   * @param {number} y Vertical pixels.
   * @param {object} [options] `{ selector, behavior }` — pass `selector` to scroll a
   *        container instead of the window.
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          The payload's `moved` is false when the page was already at its limit, which is
   *          how a caller knows an infinite list has ended.
   */
  scrollBy(x, y, options = {}) {
    return this.actions.scroll.run({ x, y, ...options });
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────

  /**
   * Press a single key.
   *
   * Delivered to the focused element, or to `selector` when one is given. A synthetic key
   * event triggers a page's handlers but produces no native effect — `Enter` will not submit
   * a form and `Tab` will not move focus.
   *
   * @param {string} key `'Enter'`, `'Escape'`, `'a'`, ...
   * @param {object} [options] `{ selector, timeout, repeatable }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   *          The payload's `defaultPrevented` shows whether a handler acted on it.
   */
  pressKey(key, options = {}) {
    return this.actions.keyboard.run({ key, ...options });
  }

  /**
   * Press a modifier combination.
   *
   * @param {string[]|string} keys `['Control', 'Enter']` or `'Control+Enter'`; the last
   *        entry is the key, the rest are modifiers.
   * @param {object} [options] `{ selector, timeout }`
   * @returns {Promise<import('./../../../workflow/activities/ActivityResult.js').ActivityResult>}
   */
  pressShortcut(keys, options = {}) {
    return this.actions.keyboard.run({ keys, ...options });
  }
}

/**
 * Interpret the second argument of `uploadFile`.
 *
 * @param {File|Blob|string|object} fileOrPath
 * @returns {object} Parameters for `UploadFileAction`.
 */
function toUploadParams(fileOrPath) {
  if (typeof fileOrPath === 'string') return { filePath: fileOrPath };
  if (fileOrPath && typeof fileOrPath === 'object' && 'content' in fileOrPath) return fileOrPath;
  return { file: fileOrPath ?? null };
}

export default ActionEngine;
