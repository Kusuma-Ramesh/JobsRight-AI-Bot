/**
 * A browser window known to the engine.
 *
 * Models are pure data: they describe what the engine observed, carry no behavior, and are
 * safely serializable into workflow state. Acting on a window is `WindowManager`'s job.
 */
export class BrowserWindow {
  /**
   * @param {object} init
   * @param {number|string} init.id       Browser-assigned window identifier.
   * @param {boolean} [init.focused]      Whether the window currently has focus.
   * @param {string}  [init.state]        'normal' | 'minimized' | 'maximized' | 'fullscreen'.
   * @param {string}  [init.type]         'normal' | 'popup' | other browser-reported type.
   * @param {Array<number|string>} [init.tabIds] Ids of the tabs this window contains.
   * @param {object}  [init.bounds]       `{ top, left, width, height }` when known.
   */
  constructor({ id, focused = false, state = 'normal', type = 'normal', tabIds = [], bounds = null } = {}) {
    this.id = id;
    this.focused = focused;
    this.state = state;
    this.type = type;
    this.tabIds = tabIds;
    this.bounds = bounds;
  }

  /** @returns {boolean} True when the window can currently show content to the user. */
  isVisible() {
    return this.state !== 'minimized';
  }

  toJSON() {
    return { id: this.id, focused: this.focused, state: this.state, type: this.type, tabIds: this.tabIds, bounds: this.bounds };
  }

  static fromJSON(json) {
    return new BrowserWindow(json);
  }

  // TODO: map browser-native window objects into this model inside `WindowManager`,
  //       so no other layer ever sees a raw browser object.
}

export default BrowserWindow;
