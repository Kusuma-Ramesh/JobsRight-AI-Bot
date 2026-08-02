import { Selector, SelectorType } from './../models/Selector.js';
import { BrowserEngineError, ErrorCode } from './../utils/Errors.js';

/**
 * Resolves a `Selector` into live DOM nodes, and describes a node's position in the tree.
 *
 * The single place where a selector expression meets the document. Both supported dialects
 * — CSS and XPath — go through here, so every caller gets the same behaviour for both, and
 * a malformed expression surfaces as a typed engine error instead of a raw `SyntaxError`
 * from deep inside a query.
 *
 * Resolution only: this file locates nodes and never touches them.
 */
export class SelectorEngine {
  /**
   * @param {object} [options]
   * @param {Document} [options.document] Document to query. Defaults to the page's own;
   *                                      injected in tests.
   */
  constructor({ document = null } = {}) {
    this.document = document ?? globalThis.document ?? null;
  }

  /**
   * The document, verified to exist.
   *
   * @returns {Document}
   * @throws {BrowserEngineError} `ENGINE_NOT_INITIALIZED` when there is none — which means
   *                              the caller is running outside a page context, and every
   *                              query would otherwise fail with a confusing type error.
   */
  requireDocument() {
    if (!this.document) {
      throw new BrowserEngineError('No document available; the DOM engine must run in a page context.', {
        code: ErrorCode.ENGINE_NOT_INITIALIZED,
        recoverable: false
      });
    }
    return this.document;
  }

  /**
   * Resolve the first node matching a selector.
   *
   * @param {Selector|object|string} selector
   * @param {Node} [root] Subtree to search within. Defaults to the document.
   * @returns {Node|null}
   * @throws {BrowserEngineError} `INVALID_ARGUMENT` when the expression is malformed.
   */
  queryFirst(selector, root = null) {
    const [first = null] = this.query(selector, root, { first: true });
    return first;
  }

  /**
   * Resolve every node matching a selector, trying the selector's fallbacks in order until
   * one produces a result.
   *
   * @param {Selector|object|string} selector
   * @param {Node} [root]
   * @param {object} [options]
   * @param {boolean} [options.first] Stop at the first node. XPath uses a cheaper
   *                                  evaluation mode when set.
   * @returns {Node[]}
   * @throws {BrowserEngineError} `INVALID_ARGUMENT` when the expression is malformed.
   */
  query(selector, root = null, { first = false } = {}) {
    const resolved = Selector.from(selector);
    const errors = resolved.validate();
    if (errors.length > 0) {
      throw new BrowserEngineError(`Invalid selector: ${errors.join('; ')}`, {
        code: ErrorCode.INVALID_ARGUMENT,
        recoverable: false,
        context: { selector: resolved.toJSON() }
      });
    }

    const scope = root ?? this.requireDocument();
    for (const candidate of resolved.chain()) {
      const nodes = candidate.isXPath()
        ? this.queryXPath(candidate.value, scope, first)
        : this.queryCss(candidate.value, scope, first);
      if (nodes.length > 0) return nodes;
    }
    return [];
  }

  /**
   * Run a CSS query.
   *
   * @param {string} expression
   * @param {Node} scope
   * @param {boolean} first
   * @returns {Node[]}
   */
  queryCss(expression, scope, first) {
    try {
      if (first) {
        const node = scope.querySelector(expression);
        return node ? [node] : [];
      }
      return Array.from(scope.querySelectorAll(expression));
    } catch (cause) {
      throw new BrowserEngineError(`Malformed CSS selector: ${expression}`, {
        code: ErrorCode.INVALID_ARGUMENT,
        recoverable: false,
        context: { expression },
        cause
      });
    }
  }

  /**
   * Run an XPath query.
   *
   * @param {string} expression
   * @param {Node} scope
   * @param {boolean} first
   * @returns {Node[]}
   */
  queryXPath(expression, scope, first) {
    const document = this.requireDocument();
    if (typeof document.evaluate !== 'function') {
      throw new BrowserEngineError('This document does not support XPath evaluation.', {
        code: ErrorCode.ENGINE_NOT_INITIALIZED,
        recoverable: false
      });
    }

    try {
      if (first) {
        const single = document.evaluate(expression, scope, null, XPATH_FIRST_ORDERED_NODE, null);
        return single.singleNodeValue ? [single.singleNodeValue] : [];
      }
      const iterator = document.evaluate(expression, scope, null, XPATH_ORDERED_SNAPSHOT, null);
      const nodes = [];
      for (let index = 0; index < iterator.snapshotLength; index += 1) nodes.push(iterator.snapshotItem(index));
      return nodes;
    } catch (cause) {
      throw new BrowserEngineError(`Malformed XPath expression: ${expression}`, {
        code: ErrorCode.INVALID_ARGUMENT,
        recoverable: false,
        context: { expression },
        cause
      });
    }
  }

  /**
   * Absolute XPath of a node, using positional indexes so it is unique.
   *
   * Positional paths are brittle by nature — inserting a sibling changes them — so this is
   * for diagnostics and snapshots, not for storing as a locator. Named selectors in
   * `v2/selectors/` are the durable form.
   *
   * @param {Node} node
   * @returns {string|null}
   */
  getXPath(node) {
    if (!node || node.nodeType !== ELEMENT_NODE) return null;
    if (node.id) return `//*[@id="${node.id}"]`;

    const segments = [];
    for (let current = node; current && current.nodeType === ELEMENT_NODE; current = current.parentNode) {
      const tag = current.tagName.toLowerCase();
      const siblings = current.parentNode ? Array.from(current.parentNode.children ?? []).filter((child) => child.tagName === current.tagName) : [];
      const index = siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : '';
      segments.unshift(`${tag}${index}`);
    }
    return `/${segments.join('/')}`;
  }

  /**
   * Unique CSS path of a node.
   *
   * Stops as soon as an `id` makes the path unambiguous, so the result stays as short as
   * the document allows.
   *
   * @param {Node} node
   * @returns {string|null}
   */
  getCssPath(node) {
    if (!node || node.nodeType !== ELEMENT_NODE) return null;

    const segments = [];
    for (let current = node; current && current.nodeType === ELEMENT_NODE; current = current.parentNode) {
      if (current.id) {
        segments.unshift(`#${cssEscape(current.id)}`);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const siblings = current.parentNode ? Array.from(current.parentNode.children ?? []).filter((child) => child.tagName === current.tagName) : [];
      const index = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : '';
      segments.unshift(`${tag}${index}`);
    }
    return segments.join(' > ');
  }

  /**
   * Whether an expression is syntactically valid, without throwing.
   *
   * @param {Selector|object|string} selector
   * @returns {boolean}
   */
  isSyntaxValid(selector) {
    try {
      this.query(selector, null, { first: true });
      return true;
    } catch (error) {
      if (error.code === ErrorCode.INVALID_ARGUMENT) return false;
      throw error;
    }
  }
}

/** `XPathResult` constants, spelled out so the module does not depend on the global. */
const XPATH_FIRST_ORDERED_NODE = 9;
const XPATH_ORDERED_SNAPSHOT = 7;
const ELEMENT_NODE = 1;

function cssEscape(value) {
  return typeof globalThis.CSS?.escape === 'function' ? globalThis.CSS.escape(value) : String(value).replace(/([^\w-])/g, '\\$1');
}

export { SelectorType };
export default SelectorEngine;
