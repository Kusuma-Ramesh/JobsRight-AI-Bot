/**
 * A serializable description of one element in the page.
 *
 * The engine never hands a live DOM node to a caller. A node is only meaningful inside the
 * page it came from — it cannot cross into workflow state, a log, or a persisted snapshot,
 * and holding one keeps a detached subtree alive after the page has moved on. `DomElement`
 * is what crosses that boundary instead: plain data, safe to serialize.
 *
 * The originating node is still reachable through `ref` for code running inside the page,
 * but it is non-enumerable and excluded from `toJSON()`, so it can never be serialized by
 * accident.
 */
export class DomElement {
  /**
   * @param {object} init
   * @param {string} init.tagName        Lowercased tag name.
   * @param {string|null} [init.id]
   * @param {string[]} [init.classList]
   * @param {object} [init.attributes]   Attribute name -> value.
   * @param {string} [init.text]         Trimmed visible text.
   * @param {string} [init.html]         `innerHTML`, only when explicitly captured.
   * @param {object|null} [init.boundingBox] `{ x, y, width, height, top, left, bottom, right }`.
   * @param {boolean} [init.visible]     Whether it is rendered and non-transparent.
   * @param {boolean} [init.enabled]     Whether it is not disabled.
   * @param {string|null} [init.xpath]   Absolute XPath, when computed.
   * @param {string|null} [init.cssPath] Unique CSS path, when computed.
   * @param {string|null} [init.value]   Current value of a form control.
   * @param {object|null} [init.ref]     The live node. Non-enumerable, never serialized.
   */
  constructor({
    tagName = '',
    id = null,
    classList = [],
    attributes = {},
    text = '',
    html = null,
    boundingBox = null,
    visible = false,
    enabled = true,
    xpath = null,
    cssPath = null,
    value = null,
    ref = null
  } = {}) {
    this.tagName = tagName;
    this.id = id;
    this.classList = classList;
    this.attributes = attributes;
    this.text = text;
    this.html = html;
    this.boundingBox = boundingBox;
    this.visible = visible;
    this.enabled = enabled;
    this.xpath = xpath;
    this.cssPath = cssPath;
    this.value = value;

    Object.defineProperty(this, 'ref', { value: ref, enumerable: false, writable: true });
  }

  /**
   * Read one attribute.
   * @param {string} name
   * @returns {string|null}
   */
  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  /**
   * @param {string} className
   * @returns {boolean}
   */
  hasClass(className) {
    return this.classList.includes(className);
  }

  /**
   * Whether the element occupies space on screen. A visible element with a zero-area box is
   * still not something a later phase could act on.
   * @returns {boolean}
   */
  hasArea() {
    return Boolean(this.boundingBox) && this.boundingBox.width > 0 && this.boundingBox.height > 0;
  }

  /**
   * Whether the element is present, visible, enabled, and has area — the condition a later
   * interaction phase will require. Reported here; never acted on.
   * @returns {boolean}
   */
  isInteractable() {
    return this.visible && this.enabled && this.hasArea();
  }

  /** Short label for errors and logs, e.g. `button#submit.primary`. */
  describe() {
    const id = this.id ? `#${this.id}` : '';
    const classes = this.classList.length > 0 ? `.${this.classList.join('.')}` : '';
    return `${this.tagName}${id}${classes}`;
  }

  toJSON() {
    return {
      tagName: this.tagName,
      id: this.id,
      classList: this.classList,
      attributes: this.attributes,
      text: this.text,
      html: this.html,
      boundingBox: this.boundingBox,
      visible: this.visible,
      enabled: this.enabled,
      xpath: this.xpath,
      cssPath: this.cssPath,
      value: this.value
    };
  }

  static fromJSON(json) {
    return new DomElement(json);
  }
}

export default DomElement;
