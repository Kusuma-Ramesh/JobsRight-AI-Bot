import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * The runtime's publish/subscribe bus.
 *
 * This is the seam that lets the workflow engine and the browser engine observe each other
 * without depending on each other. The browser engine publishes what it sees; the workflow
 * engine publishes what it decides; the UI and `LogManager` subscribe to both. No subsystem
 * holds a reference to another.
 *
 * Distinct from `EventService` in `v2/engine/browser`: that bus is internal to the browser
 * engine and carries only browser events. The runtime bus is session-wide, and the runtime
 * forwards browser events onto it.
 */
export class EventBus {
  /**
   * @param {object} [options]
   * @param {boolean} [options.recordHistory] Retain published events for inspection.
   * @param {number}  [options.historyLimit]  Maximum retained events.
   */
  constructor({ recordHistory = false, historyLimit = 1000 } = {}) {
    this.recordHistory = recordHistory;
    this.historyLimit = historyLimit;
    /** @type {Map<string, Set<Function>>} Event type (or namespace pattern) -> handlers. */
    this.subscribers = new Map();
    /** @type {import('./Event.js').Event[]} */
    this.history = [];
  }

  /**
   * Publish an event to every matching subscriber.
   *
   * @param {import('./Event.js').Event|object} event An `Event`, or its fields.
   * @returns {void}
   */
  publish(event) {
    // TODO: normalize plain objects into `Event` instances and validate before dispatch.
    // TODO: deliver to exact-type subscribers and to wildcard subscribers (`workflow.*`).
    // TODO: isolate each handler — a throwing subscriber must not break the publisher or
    //       the other subscribers; report the failure through the logger instead.
    // TODO: append to `history` when enabled, trimming to `historyLimit`.
    throw new NotImplementedError('EventBus.publish');
  }

  /**
   * Register a handler.
   *
   * @param {string} type One of `EventTypes`, or a namespace wildcard like `'browser.*'`.
   * @param {(event: import('./Event.js').Event) => void} handler
   * @returns {() => void} Unsubscribe function, so callers can clean up without retaining
   *                       the original handler reference.
   */
  subscribe(type, handler) {
    // TODO: implement registration and return a disposer.
    throw new NotImplementedError('EventBus.subscribe');
  }

  /**
   * Remove a previously registered handler.
   * @param {string} type
   * @param {(event: import('./Event.js').Event) => void} handler
   * @returns {void}
   */
  unsubscribe(type, handler) {
    // TODO: implement; removing an unregistered handler must be a no-op, not an error.
    throw new NotImplementedError('EventBus.unsubscribe');
  }

  /**
   * Drop every subscriber and any recorded history. Called at session teardown, where a
   * leftover listener would otherwise keep the previous session's objects alive.
   * @returns {void}
   */
  clear() {
    // TODO: implement.
    throw new NotImplementedError('EventBus.clear');
  }

  /**
   * Subscribe for a single delivery.
   * @param {string} type
   * @param {(event: import('./Event.js').Event) => void} handler
   * @returns {() => void}
   */
  once(type, handler) {
    // TODO: implement on top of `subscribe`, self-disposing after the first delivery.
    throw new NotImplementedError('EventBus.once');
  }

  /**
   * Resolve when a matching event is published, or reject on timeout.
   * @param {string} type
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {(event: import('./Event.js').Event) => boolean} [options.filter]
   * @returns {Promise<import('./Event.js').Event>}
   */
  async waitFor(type, options) {
    // TODO: implement using `once` plus a deadline.
    throw new NotImplementedError('EventBus.waitFor');
  }

  /**
   * Retained events, newest last.
   * @param {object} [filter] `{ type, sessionId, since }`
   * @returns {import('./Event.js').Event[]}
   */
  getHistory(filter) {
    // TODO: implement.
    throw new NotImplementedError('EventBus.getHistory');
  }
}

export default EventBus;
