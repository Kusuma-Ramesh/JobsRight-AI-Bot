/**
 * A way of locating an element, independent of how it will be used.
 *
 * A selector is data, not behavior: it says *what* to look for, never what to do with the
 * result. Keeping it a model means the same locator can be reused by a read, a wait, and
 * later an interaction, and that `v2/selectors/` can store locators as plain serializable
 * definitions rather than as code.
 */

/** How a selector's value should be interpreted. */
export const SelectorType = Object.freeze({
  Css: 'css',
  XPath: 'xpath'
});

export class Selector {
  /**
   * @param {object|string} init A `Selector`-shaped object, or a raw string parsed by
   *                             `Selector.from`.
   * @param {string} init.value       The selector expression.
   * @param {string} [init.type]      One of `SelectorType`. Inferred when omitted.
   * @param {string} [init.name]      Human-readable label used in errors and logs.
   * @param {number} [init.timeout]   Default wait, in milliseconds, when this selector is
   *                                  used with `waitForElement`.
   * @param {string[]} [init.fallbacks] Alternative expressions tried in order when the
   *                                  primary finds nothing. Page markup changes; a
   *                                  selector that can degrade beats one that just fails.
   * @param {string} [init.description]
   */
  constructor({ value, type = null, name = null, timeout = null, fallbacks = [], description = null } = {}) {
    this.value = value;
    this.type = type ?? Selector.inferType(value);
    this.name = name;
    this.timeout = timeout;
    this.fallbacks = fallbacks;
    this.description = description;
  }

  /**
   * Build a `Selector` from a string, an object, or an existing instance.
   *
   * Accepted string forms:
   * - `'#submit'` — a CSS selector;
   * - `'//button[@type="submit"]'` or `'(//div)[1]'` — recognised as XPath;
   * - `'xpath=//button'` / `'css=#submit'` — explicit prefixes, for when inference would
   *   be wrong.
   *
   * @param {Selector|object|string} input
   * @returns {Selector}
   */
  static from(input) {
    if (input instanceof Selector) return input;
    if (typeof input === 'string') {
      if (input.startsWith('xpath=')) return new Selector({ value: input.slice(6), type: SelectorType.XPath });
      if (input.startsWith('css=')) return new Selector({ value: input.slice(4), type: SelectorType.Css });
      return new Selector({ value: input });
    }
    return new Selector(input ?? {});
  }

  /**
   * Guess how an expression should be interpreted. XPath is recognised by its leading
   * axis or grouping; everything else is treated as CSS.
   *
   * @param {string} value
   * @returns {string} One of `SelectorType`.
   */
  static inferType(value) {
    if (typeof value !== 'string') return SelectorType.Css;
    const trimmed = value.trim();
    const looksLikeXPath = trimmed.startsWith('/') || trimmed.startsWith('(/') || trimmed.startsWith('./') || trimmed.startsWith('..');
    return looksLikeXPath ? SelectorType.XPath : SelectorType.Css;
  }

  /** @returns {boolean} */
  isXPath() {
    return this.type === SelectorType.XPath;
  }

  /** @returns {boolean} */
  isCss() {
    return this.type === SelectorType.Css;
  }

  /**
   * Every expression to try, primary first.
   * @returns {Selector[]}
   */
  chain() {
    return [this, ...this.fallbacks.map((value) => new Selector({ value, name: this.name }))];
  }

  /**
   * Structural validation. Returns a list of problems; empty means valid.
   * @returns {string[]}
   */
  validate() {
    const errors = [];
    if (typeof this.value !== 'string' || this.value.trim() === '') errors.push('value must be a non-empty string');
    if (!Object.values(SelectorType).includes(this.type)) errors.push(`type must be one of ${Object.values(SelectorType).join(', ')}`);
    return errors;
  }

  /** @returns {boolean} */
  isValid() {
    return this.validate().length === 0;
  }

  /** Label for errors and logs: the name when there is one, else the expression. */
  toString() {
    return this.name ? `${this.name} (${this.type}: ${this.value})` : `${this.type}: ${this.value}`;
  }

  toJSON() {
    return {
      value: this.value,
      type: this.type,
      name: this.name,
      timeout: this.timeout,
      fallbacks: this.fallbacks,
      description: this.description
    };
  }

  static fromJSON(json) {
    return new Selector(json);
  }
}

export default Selector;
