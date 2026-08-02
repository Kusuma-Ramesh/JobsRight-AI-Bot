/**
 * A tiny stand-in for a document, so the DOM engine can be exercised outside a browser.
 *
 * **What this does and does not prove.** It is not a DOM implementation and does not parse
 * CSS or XPath: a "selector" is a key in a map of prepared elements. That is enough to test
 * everything the engine itself owns — selector parsing and dispatch, fallback chains,
 * validation, wait/poll behaviour, traversal, and the mapping into `DomElement` — and
 * nothing about the browser's own query engines, which are not ours to test.
 *
 * A real runner with a real DOM (`jsdom`, or Chrome itself) is the right home for coverage
 * of actual CSS and XPath matching; these placeholders should move there, not grow a
 * homegrown selector engine.
 */

/**
 * Build a fake element.
 *
 * @param {object} init `{ tagName, id, classList, attributes, text, html, box, style, disabled, value, children }`
 * @returns {object}
 */
export function createElement({
  tagName = 'div',
  id = '',
  classList = [],
  attributes = {},
  text = '',
  html = '',
  box = { x: 0, y: 0, width: 100, height: 20, top: 0, left: 0, bottom: 20, right: 100 },
  style = {},
  disabled = false,
  value = null,
  children = []
} = {}) {
  const element = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    id,
    classList,
    textContent: text,
    innerHTML: html,
    disabled,
    value,
    children,
    parentNode: null,
    parentElement: null,
    attributes: Object.entries(attributes).map(([name, attributeValue]) => ({ name, value: attributeValue })),
    style,
    getAttribute: (name) => attributes[name] ?? null,
    hasAttribute: (name) => Object.prototype.hasOwnProperty.call(attributes, name),
    getBoundingClientRect: () => box
  };

  for (const child of children) {
    child.parentNode = element;
    child.parentElement = element;
  }
  return element;
}

/**
 * Build a fake document whose queries are map lookups.
 *
 * @param {object} init
 * @param {object} [init.elements] Selector string -> element or array of elements.
 * @param {object} [init.xpath]    XPath string -> element or array of elements.
 * @param {string} [init.url]
 * @param {string} [init.title]
 * @param {string} [init.readyState]
 * @param {number} [init.elementCount] What `querySelectorAll('*')` should report.
 * @returns {object}
 */
export function createDocument({ elements = {}, xpath = {}, url = 'https://example.test/page', title = 'Example', readyState = 'complete', elementCount = 0 } = {}) {
  const lookup = (map, key) => {
    const found = map[key];
    if (found === undefined) return [];
    return Array.isArray(found) ? found : [found];
  };

  return {
    location: { href: url },
    title,
    readyState,
    documentElement: { outerHTML: '<html></html>' },
    querySelector(selector) {
      if (selector === '*') return null;
      if (INVALID_SELECTORS.includes(selector)) throw new SyntaxError(`invalid selector: ${selector}`);
      return lookup(elements, selector)[0] ?? null;
    },
    querySelectorAll(selector) {
      if (selector === '*') return { length: elementCount };
      if (INVALID_SELECTORS.includes(selector)) throw new SyntaxError(`invalid selector: ${selector}`);
      return lookup(elements, selector);
    },
    evaluate(expression, _scope, _resolver, type) {
      if (INVALID_SELECTORS.includes(expression)) throw new SyntaxError(`invalid xpath: ${expression}`);
      const nodes = lookup(xpath, expression);
      if (type === 9) return { singleNodeValue: nodes[0] ?? null };
      return { snapshotLength: nodes.length, snapshotItem: (index) => nodes[index] };
    }
  };
}

/** A fake window supplying computed styles and viewport size. */
export function createWindow({ innerWidth = 1280, innerHeight = 800, scrollX = 0, scrollY = 0 } = {}) {
  return {
    innerWidth,
    innerHeight,
    scrollX,
    scrollY,
    getComputedStyle: (element) => ({ display: 'block', visibility: 'visible', opacity: '1', ...(element.style ?? {}) })
  };
}

/** Expressions the fake treats as malformed, for the error paths. */
export const INVALID_SELECTORS = ['<<<bad', '//[[['];

export default createDocument;
