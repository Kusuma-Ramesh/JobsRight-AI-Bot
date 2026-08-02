import { NotImplementedError } from './../utils/Errors.js';

/**
 * Engine events other layers can subscribe to.
 * Names are stable identifiers; consumers must never match on message text.
 */
export const EngineEvent = Object.freeze({
  WindowDetected: 'window.detected',
  WindowFocused: 'window.focused',
  TabDetected: 'tab.detected',
  TabSwitched: 'tab.switched',
  TabOpened: 'tab.opened',
  TabClosed: 'tab.closed',
  PageNavigated: 'page.navigated',
  PageReady: 'page.ready',
  ElementFound: 'element.found',
  ActivityStarted: 'activity.started',
  ActivityFinished: 'activity.finished',
  DownloadStarted: 'download.started',
  DownloadCompleted: 'download.completed',
  ScreenshotCaptured: 'screenshot.captured',
  EngineError: 'engine.error'
});

/**
 * Publish/subscribe bus for engine events.
 *
 * The engine must never call into the workflow layer directly — that would invert the
 * dependency rule. Instead it emits events, and the workflow observes them. This is also
 * what makes a run watchable in real time without polling state.
 */
export class EventService {
  /**
   * @param {object} [options]
   * @param {object} [options.logger] `Logger` instance.
   */
  constructor({ logger = null } = {}) {
    this.logger = logger;
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event One of `EngineEvent`.
   * @param {(payload: object) => void} handler
   * @returns {() => void} Unsubscribe function.
   */
  on(event, handler) {
    // TODO: implement registration and return a disposer.
    throw new NotImplementedError('EventService.on');
  }

  /**
   * Subscribe for a single delivery.
   * @param {string} event
   * @param {(payload: object) => void} handler
   * @returns {() => void}
   */
  once(event, handler) {
    // TODO: implement on top of `on`, self-disposing after the first call.
    throw new NotImplementedError('EventService.once');
  }

  /**
   * Remove a previously registered handler.
   * @param {string} event
   * @param {(payload: object) => void} handler
   * @returns {void}
   */
  off(event, handler) {
    // TODO: implement.
    throw new NotImplementedError('EventService.off');
  }

  /**
   * Publish an event to all subscribers.
   * A throwing subscriber must never break the engine or other subscribers.
   *
   * @param {string} event
   * @param {object} [payload]
   * @returns {void}
   */
  emit(event, payload) {
    // TODO: implement with per-handler isolation, logging handler failures.
    throw new NotImplementedError('EventService.emit');
  }

  /**
   * Resolve when an event occurs, or reject when the deadline elapses.
   * Used to await browser-driven transitions such as navigation completion.
   *
   * @param {string} event
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {(payload: object) => boolean} [options.filter]
   * @returns {Promise<object>}
   */
  async waitForEvent(event, options) {
    // TODO: implement using `once` plus `TimeoutService.withTimeout`.
    throw new NotImplementedError('EventService.waitForEvent');
  }

  /** Remove every listener; called during engine shutdown. */
  removeAll() {
    // TODO: implement.
    throw new NotImplementedError('EventService.removeAll');
  }
}

export default EventService;
