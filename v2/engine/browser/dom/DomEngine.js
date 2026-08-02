import { DomSnapshot } from './DomSnapshot.js';
import { ElementFinder } from './ElementFinder.js';
import { ElementNotFoundError } from './../utils/Errors.js';
import { ElementValidator } from './ElementValidator.js';
import { Selector } from './../models/Selector.js';
import { SelectorEngine } from './SelectorEngine.js';

/**
 * The DOM layer's façade: locate and inspect elements, and nothing else.
 *
 * The boundary is deliberate and absolute. This engine **reads** the page — it finds,
 * waits, measures, and describes. It never clicks, types, scrolls, uploads, submits, or
 * navigates. Interaction is the next phase's job, and keeping the two apart means every
 * method here is safe to call at any point in a run, including on a page mid-transition.
 *
 * It is also entirely generic: no JobsRight, ChatGPT, or Bulk Job Apply knowledge, and no
 * selectors of its own. Callers supply locators; `v2/selectors/` will store them.
 *
 * Runs in a page context (a content script or an injected function), where `document`
 * exists. Both `document` and `window` are injected rather than reached for, so the engine
 * is testable outside a browser.
 */
export class DomEngine {
  /**
   * @param {object} [options]
   * @param {Document} [options.document]
   * @param {object} [options.window]
   * @param {SelectorEngine} [options.selectorEngine]
   * @param {ElementFinder} [options.finder]
   * @param {ElementValidator} [options.validator]
   * @param {number} [options.timeout]  Default wait for `waitForElement`.
   * @param {object} [options.logger]
   */
  constructor({ document = null, window = null, selectorEngine = null, finder = null, validator = null, timeout = undefined, logger = null } = {}) {
    this.document = document ?? globalThis.document ?? null;
    this.window = window ?? globalThis.window ?? null;
    this.selectorEngine = selectorEngine ?? new SelectorEngine({ document: this.document });
    this.validator = validator ?? new ElementValidator({ window: this.window });
    this.finder = finder ?? new ElementFinder({ selectorEngine: this.selectorEngine, validator: this.validator, timeout });
    this.logger = logger;
  }

  // ── Finding ────────────────────────────────────────────────────────────────

  /**
   * Find the first element matching a selector.
   *
   * @param {Selector|object|string} selector CSS or XPath; see `Selector.from`.
   * @param {object} [options] `{ root, html, paths, required }`
   * @returns {DomElement|null} Null when nothing matches, unless `required` is set.
   * @throws {ElementNotFoundError} `ELEMENT_NOT_FOUND` when `required` and nothing matches.
   * @throws {BrowserEngineError} `INVALID_ARGUMENT` when the expression is malformed.
   */
  findElement(selector, options) {
    return this.finder.find(selector, options);
  }

  /**
   * Find every element matching a selector.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root, html, paths }`
   * @returns {DomElement[]} Empty when nothing matches.
   */
  findElements(selector, options) {
    return this.finder.findAll(selector, options);
  }

  /**
   * Whether at least one element matches.
   *
   * A malformed selector still throws: a silent `false` would hide a typo behind what looks
   * like a missing element.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {boolean}
   */
  elementExists(selector, options) {
    return this.finder.exists(selector, options);
  }

  /**
   * Wait for an element to reach a state.
   *
   * @param {Selector|object|string} selector
   * @param {number|object} [timeout] Milliseconds, or an options object
   *                                  `{ timeout, interval, state, root }`. `state` is
   *                                  `'present'` (default), `'visible'`, `'enabled'`,
   *                                  `'interactable'`, or `'absent'`.
   * @returns {Promise<DomElement|null>}
   * @throws {TimeoutError} `TIMEOUT`, naming the selector and the awaited state.
   */
  async waitForElement(selector, timeout = undefined) {
    const options = typeof timeout === 'object' && timeout !== null ? timeout : { timeout };
    return this.finder.waitFor(selector, options);
  }

  // ── Reading ────────────────────────────────────────────────────────────────

  /**
   * Trimmed visible text of the first match.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root, required }`
   * @returns {string|null} Null when nothing matches and `required` is not set.
   */
  readText(selector, { root = null, required = false } = {}) {
    return this.requireElement(selector, { root, required })?.text ?? null;
  }

  /**
   * `innerHTML` of the first match.
   *
   * Markup is only ever returned when explicitly asked for, never captured incidentally —
   * these pages contain resume text and personal data, and this value can end up in a log
   * or a snapshot.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root, required }`
   * @returns {string|null}
   */
  readHTML(selector, { root = null, required = false } = {}) {
    return this.requireElement(selector, { root, required, html: true })?.html ?? null;
  }

  /**
   * One attribute of the first match.
   *
   * @param {Selector|object|string} selector
   * @param {string} attribute
   * @param {object} [options] `{ root, required }`
   * @returns {string|null} Null when the element or the attribute is absent — the two are
   *          distinguishable via `findElement(...)?.hasAttribute(name)`.
   */
  readAttribute(selector, attribute, { root = null, required = false } = {}) {
    return this.requireElement(selector, { root, required })?.getAttribute(attribute) ?? null;
  }

  /**
   * Bounding box of the first match, in viewport coordinates.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root, required }`
   * @returns {object|null} `{ x, y, width, height, top, left, bottom, right }`.
   */
  getBoundingBox(selector, { root = null, required = false } = {}) {
    return this.requireElement(selector, { root, required })?.boundingBox ?? null;
  }

  // ── Traversal ──────────────────────────────────────────────────────────────

  /**
   * Parent of the first match.
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {DomElement|null}
   */
  getParent(selector, options) {
    return this.finder.parentOf(selector, options);
  }

  /**
   * Element children of the first match. Text nodes are excluded; use `readText` for text.
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {DomElement[]}
   */
  getChildren(selector, options) {
    return this.finder.childrenOf(selector, options);
  }

  /**
   * Absolute XPath of the first match.
   *
   * Positional and therefore brittle — a sibling inserted above changes it. Intended for
   * diagnostics and snapshots, not for storing as a locator; named selectors in
   * `v2/selectors/` are the durable form.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {string|null}
   */
  getXPath(selector, { root = null } = {}) {
    const node = this.selectorEngine.queryFirst(selector, root);
    return node ? this.selectorEngine.getXPath(node) : null;
  }

  /**
   * Unique CSS path of the first match, shortened at the nearest ancestor with an `id`.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {string|null}
   */
  getCssPath(selector, { root = null } = {}) {
    const node = this.selectorEngine.queryFirst(selector, root);
    return node ? this.selectorEngine.getCssPath(node) : null;
  }

  // ── Inspection ─────────────────────────────────────────────────────────────

  /**
   * An explainable verdict on the first match: present, visible, enabled, in viewport.
   *
   * Reported, never acted on. "Found but hidden" is a different failure from "not found",
   * and this is what lets a caller say which one happened.
   *
   * @param {Selector|object|string} selector
   * @param {object} [options] `{ root }`
   * @returns {{ exists: boolean, visible: boolean, enabled: boolean, inViewport: boolean, interactable: boolean, reason: string|null }}
   */
  inspectElement(selector, { root = null } = {}) {
    return this.validator.inspect(this.selectorEngine.queryFirst(selector, root));
  }

  /**
   * Capture the page as a serializable `DomSnapshot`.
   *
   * Pass `elements` to record the state of the locators a step depends on — that is what
   * makes a later failure diagnosable, since a missing label in the snapshot names the
   * element that was not there.
   *
   * `includeHtml` is off by default and should stay off unless a specific investigation
   * needs it: full markup carries resume text and personal data into wherever the snapshot
   * is stored.
   *
   * @param {object} [options]
   * @param {object} [options.elements]    Label -> selector, recorded in the snapshot.
   * @param {boolean} [options.includeHtml] Capture the document's full markup.
   * @param {string} [options.label]       Why the snapshot was taken.
   * @returns {DomSnapshot}
   */
  captureDomSnapshot({ elements = {}, includeHtml = false, label = null } = {}) {
    const document = this.selectorEngine.requireDocument();
    const captured = {};

    for (const [name, selector] of Object.entries(elements)) {
      const element = this.findElement(selector, { paths: true });
      captured[name] = element ? element.toJSON() : null;
    }

    return new DomSnapshot({
      url: document.location?.href ?? '',
      title: document.title ?? '',
      readyState: document.readyState ?? 'unknown',
      viewport: this.window
        ? { width: this.window.innerWidth ?? 0, height: this.window.innerHeight ?? 0, scrollX: this.window.scrollX ?? 0, scrollY: this.window.scrollY ?? 0 }
        : null,
      elements: captured,
      elementCount: document.querySelectorAll?.('*').length ?? 0,
      html: includeHtml ? document.documentElement?.outerHTML ?? null : null,
      label
    });
  }

  /**
   * Find the first match, honouring `required`.
   *
   * @param {Selector|object|string} selector
   * @param {object} options `{ root, required, html }`
   * @returns {DomElement|null}
   * @throws {ElementNotFoundError} When `required` and nothing matches.
   */
  requireElement(selector, { root = null, required = false, html = false } = {}) {
    const element = this.finder.find(selector, { root, html });
    if (!element && required) {
      throw new ElementNotFoundError(`No element matched ${Selector.from(selector)}.`, {
        selector: String(Selector.from(selector))
      });
    }
    return element;
  }
}

export default DomEngine;
