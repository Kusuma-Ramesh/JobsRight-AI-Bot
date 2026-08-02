/**
 * A serializable capture of the page at one moment.
 *
 * An automation run is unattended, so when a step fails the page it failed on is already
 * gone. A snapshot is the record that makes the failure diagnosable afterwards: what was
 * loaded, which of the expected elements were present, and what state they were in.
 *
 * It is a *description*, never a copy. Full markup is opt-in and off by default — pages
 * here contain resume text and personal data, and a snapshot is written to
 * `v2/data/screenshots/` and carried in workflow state, so capturing everything by default
 * would persist exactly the data that must not be stored.
 */
export class DomSnapshot {
  /**
   * @param {object} init
   * @param {string} [init.url]        Page url at capture time.
   * @param {string} [init.title]      Document title.
   * @param {string} [init.readyState] `document.readyState`.
   * @param {object} [init.viewport]   `{ width, height, scrollX, scrollY }`.
   * @param {object} [init.elements]   Label -> `DomElement` JSON, for the elements a caller
   *                                   asked about.
   * @param {number} [init.elementCount] Total elements in the document.
   * @param {string|null} [init.html]  Full markup, only when explicitly requested.
   * @param {string} [init.capturedAt] ISO-8601 capture time.
   * @param {string|null} [init.label] Why it was captured, e.g. 'step-failed:apply'.
   */
  constructor({
    url = '',
    title = '',
    readyState = 'unknown',
    viewport = null,
    elements = {},
    elementCount = 0,
    html = null,
    capturedAt = new Date().toISOString(),
    label = null
  } = {}) {
    this.url = url;
    this.title = title;
    this.readyState = readyState;
    this.viewport = viewport;
    this.elements = elements;
    this.elementCount = elementCount;
    this.html = html;
    this.capturedAt = capturedAt;
    this.label = label;
  }

  /**
   * Whether the document had finished loading when this was captured.
   * @returns {boolean}
   */
  isComplete() {
    return this.readyState === 'complete';
  }

  /**
   * Labels of the requested elements that were not found.
   * @returns {string[]}
   */
  getMissing() {
    return Object.entries(this.elements)
      .filter(([, element]) => element === null)
      .map(([label]) => label);
  }

  /**
   * A one-line summary for a log line.
   * @returns {string}
   */
  describe() {
    const missing = this.getMissing();
    const missingNote = missing.length > 0 ? `, missing: ${missing.join(', ')}` : '';
    return `${this.title || '(untitled)'} — ${this.url} [${this.readyState}, ${this.elementCount} elements${missingNote}]`;
  }

  toJSON() {
    return {
      url: this.url,
      title: this.title,
      readyState: this.readyState,
      viewport: this.viewport,
      elements: this.elements,
      elementCount: this.elementCount,
      html: this.html,
      capturedAt: this.capturedAt,
      label: this.label
    };
  }

  static fromJSON(json) {
    return new DomSnapshot(json);
  }
}

export default DomSnapshot;
