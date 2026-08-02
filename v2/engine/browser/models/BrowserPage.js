/**
 * The document loaded inside a tab, as observed by the engine.
 *
 * A tab is a container that outlives navigations; a page is what is currently loaded in it.
 * Separating the two lets the engine detect that a tab navigated away mid-activity — a
 * common and otherwise silent cause of automation failures.
 */
export class BrowserPage {
  /**
   * @param {object} init
   * @param {number|string} init.tabId       Tab this page is loaded in.
   * @param {string}  [init.url]             Fully resolved url of the document.
   * @param {string}  [init.title]           Document title.
   * @param {string}  [init.readyState]      'loading' | 'interactive' | 'complete'.
   * @param {string}  [init.navigationId]    Changes on every navigation within the tab.
   * @param {number}  [init.loadedAt]        Epoch ms when the document finished loading.
   * @param {object}  [init.metadata]        Extra observations (frame count, http status).
   */
  constructor({ tabId, url = '', title = '', readyState = 'loading', navigationId = null, loadedAt = null, metadata = {} } = {}) {
    this.tabId = tabId;
    this.url = url;
    this.title = title;
    this.readyState = readyState;
    this.navigationId = navigationId;
    this.loadedAt = loadedAt;
    this.metadata = metadata;
  }

  /** @returns {boolean} True when the document is parsed and safe to query. */
  isInteractive() {
    return this.readyState === 'interactive' || this.readyState === 'complete';
  }

  /** @returns {boolean} True when the document and its subresources have finished loading. */
  isComplete() {
    return this.readyState === 'complete';
  }

  /**
   * Whether this page and another describe the same document instance.
   * Used to detect navigation between the start and end of an interaction.
   *
   * @param {BrowserPage} other
   * @returns {boolean}
   */
  isSameDocument(other) {
    return Boolean(other) && this.tabId === other.tabId && this.navigationId === other.navigationId;
  }

  toJSON() {
    return {
      tabId: this.tabId,
      url: this.url,
      title: this.title,
      readyState: this.readyState,
      navigationId: this.navigationId,
      loadedAt: this.loadedAt,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new BrowserPage(json);
  }

  // TODO: populate `navigationId` from a browser navigation event in `PageManager`.
}

export default BrowserPage;
