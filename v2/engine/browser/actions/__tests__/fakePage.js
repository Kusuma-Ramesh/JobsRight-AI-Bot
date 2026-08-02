import { createDocument, createWindow } from './../../dom/__tests__/fakeDom.js';

/**
 * A fake page that records interactions, so actions can be exercised outside a browser.
 *
 * **What this proves and what it cannot.** Every event an action dispatches is captured, so
 * the sequence, the modifiers, the order relative to focus and scroll, and the guards that
 * run before any of it are all verifiable — which is the part this layer owns. What it
 * cannot prove is the browser's response to an untrusted event: whether a real framework
 * re-renders, whether a real form submits. That needs a real DOM, and belongs in a runner
 * with `jsdom` or Chrome once one exists.
 *
 * Interactive elements are built on the DOM fake's shape and add what an action needs:
 * `dispatchEvent`, `focus`/`blur`, `scrollIntoView`, and a prototype-level `value` setter,
 * which is the path a framework-managed field is written through.
 */

/** An element prototype carrying a native-style `value` accessor. */
const interactivePrototype = {
  get value() {
    return this._value;
  },
  set value(next) {
    this._value = next;
    this.valueSetterCalls.push(next);
  }
};

/**
 * Build an interactive fake element.
 *
 * @param {object} init `{ tagName, id, classList, attributes, text, html, box, style,
 *        disabled, value, children, type, multiple, isContentEditable, cancel }`
 *        `cancel` lists event types whose handlers call `preventDefault`.
 * @returns {object}
 */
export function createInteractiveElement({
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
  children = [],
  type = null,
  multiple = false,
  isContentEditable = false,
  cancel = []
} = {}) {
  const element = Object.create(interactivePrototype);

  Object.assign(element, {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    id,
    classList,
    textContent: text,
    innerHTML: html,
    disabled,
    children,
    parentNode: null,
    parentElement: null,
    attributes: Object.entries(attributes).map(([name, attributeValue]) => ({ name, value: attributeValue })),
    style,
    type,
    multiple,
    isContentEditable,
    files: null,
    scrollLeft: 0,
    scrollTop: 0,
    _value: value,
    valueSetterCalls: [],
    events: [],
    focusCalls: 0,
    blurCalls: 0,
    scrollIntoViewCalls: [],
    getAttribute: (name) => attributes[name] ?? null,
    hasAttribute: (name) => Object.prototype.hasOwnProperty.call(attributes, name),
    getBoundingClientRect: () => box,
    dispatchEvent(event) {
      this.events.push(event);
      return !cancel.includes(event.type);
    },
    focus() {
      this.focusCalls += 1;
      if (this.ownerDocument) this.ownerDocument.activeElement = this;
    },
    blur() {
      this.blurCalls += 1;
      if (this.ownerDocument?.activeElement === this) this.ownerDocument.activeElement = null;
    },
    scrollIntoView(options) {
      this.scrollIntoViewCalls.push(options ?? {});
    },
    /** Event types dispatched so far, in order. */
    eventTypes() {
      return this.events.map((event) => event.type);
    }
  });

  for (const child of children) {
    child.parentNode = element;
    child.parentElement = element;
  }
  return element;
}

/**
 * Build a document over interactive elements, tracking `activeElement`.
 *
 * @param {object} init Same shape as the DOM fake's `createDocument`.
 * @returns {object}
 */
export function createInteractiveDocument(init = {}) {
  const document = createDocument(init);
  document.activeElement = null;
  document.body = createInteractiveElement({ tagName: 'body' });
  document.body.ownerDocument = document;

  for (const entry of Object.values(init.elements ?? {})) {
    for (const element of Array.isArray(entry) ? entry : [entry]) {
      element.ownerDocument = document;
    }
  }
  return document;
}

/**
 * A window that records scrolling and supplies event constructors.
 *
 * The constructors are plain objects rather than real `Event` instances: an action only
 * needs a value with a `type` and its init fields, and the assertions read exactly those.
 *
 * @param {object} [init] `{ innerWidth, innerHeight, scrollX, scrollY }`
 * @returns {object}
 */
export function createInteractiveWindow(init = {}) {
  const window = createWindow(init);
  window.scrollCalls = [];
  window.scrollBy = ({ left = 0, top = 0, behavior = 'auto' } = {}) => {
    window.scrollCalls.push({ left, top, behavior });
    window.scrollX += left;
    window.scrollY += top;
  };
  window.MouseEvent = function MouseEvent(type, detail) {
    return { type, ...detail };
  };
  window.KeyboardEvent = function KeyboardEvent(type, detail) {
    return { type, ...detail };
  };
  window.Event = function Event(type, detail) {
    return { type, ...detail };
  };
  return window;
}

/** A minimal `DataTransfer`/`File` pair, for the upload path. */
export function withFileSupport(window) {
  window.File = function File(parts, name, options = {}) {
    return { name, type: options.type ?? '', parts };
  };
  window.DataTransfer = function DataTransfer() {
    const files = [];
    return { items: { add: (file) => files.push(file) }, files };
  };
  return window;
}

export default createInteractiveDocument;
