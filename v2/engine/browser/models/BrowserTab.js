/**
 * A browser tab known to the engine.
 *
 * Pure data. A tab is the unit the workflow addresses when it says "the JobsRight tab" —
 * but the model itself holds no application knowledge, only what the browser reports.
 */
export class BrowserTab {
  /**
   * @param {object} init
   * @param {number|string} init.id        Browser-assigned tab identifier.
   * @param {number|string} [init.windowId] Owning window's identifier.
   * @param {string}  [init.url]           Current url.
   * @param {string}  [init.title]         Current document title.
   * @param {boolean} [init.active]        Whether it is the active tab in its window.
   * @param {string}  [init.status]        'loading' | 'complete'.
   * @param {number}  [init.index]         Position within its window.
   * @param {boolean} [init.discarded]     Whether the browser unloaded it to save memory.
   */
  constructor({ id, windowId = null, url = '', title = '', active = false, status = 'loading', index = -1, discarded = false } = {}) {
    this.id = id;
    this.windowId = windowId;
    this.url = url;
    this.title = title;
    this.active = active;
    this.status = status;
    this.index = index;
    this.discarded = discarded;
  }

  /** @returns {boolean} True when the tab has finished loading and can be interacted with. */
  isReady() {
    return this.status === 'complete' && !this.discarded;
  }

  toJSON() {
    return {
      id: this.id,
      windowId: this.windowId,
      url: this.url,
      title: this.title,
      active: this.active,
      status: this.status,
      index: this.index,
      discarded: this.discarded
    };
  }

  static fromJSON(json) {
    return new BrowserTab(json);
  }

  // TODO: map browser-native tab objects into this model inside `TabManager`.
}

export default BrowserTab;
