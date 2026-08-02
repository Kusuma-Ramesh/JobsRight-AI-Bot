import { NotImplementedError } from './../utils/Errors.js';

/**
 * Deadline and polling primitives.
 *
 * Every wait in the engine goes through this service, for one reason: a fixed `sleep` is the
 * single largest source of flakiness in browser automation. Callers express *what* they are
 * waiting for as a predicate plus a deadline, and this service handles the polling, the
 * cancellation, and the timeout error.
 */
export class TimeoutService {
  /**
   * @param {object} [options]
   * @param {number} [options.defaultTimeout] Default deadline in milliseconds.
   * @param {number} [options.pollInterval]   Default gap between predicate evaluations.
   * @param {object} [options.logger]         `Logger` instance.
   */
  constructor({ defaultTimeout = 30000, pollInterval = 250, logger = null } = {}) {
    this.defaultTimeout = defaultTimeout;
    this.pollInterval = pollInterval;
    this.logger = logger;
  }

  /**
   * Poll a predicate until it returns a truthy value or the deadline elapses.
   *
   * @param {() => (boolean|Promise<boolean>)} predicate
   * @param {object} [options]
   * @param {number} [options.timeout]
   * @param {number} [options.interval]
   * @param {string} [options.description] Used in the timeout error and logs.
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<*>} The predicate's truthy value.
   * @throws {TimeoutError} When the deadline elapses first.
   */
  async waitFor(predicate, options) {
    // TODO: implement polling honouring `signal`, and throw `TimeoutError` on expiry.
    // TODO: never let a slow predicate overrun the deadline — race it against the timer.
    throw new NotImplementedError('TimeoutService.waitFor');
  }

  /**
   * Run a promise with an upper bound on its duration.
   *
   * @param {Promise<*>|(() => Promise<*>)} task
   * @param {number} [timeout]
   * @param {string} [description]
   * @returns {Promise<*>}
   * @throws {TimeoutError}
   */
  async withTimeout(task, timeout, description) {
    // TODO: implement with `Promise.race` and guaranteed timer cleanup.
    throw new NotImplementedError('TimeoutService.withTimeout');
  }

  /**
   * Create a deadline object that several sequential steps can share, so a multi-step
   * operation cannot exceed its total budget by restarting the clock at each step.
   *
   * @param {number} [timeout]
   * @returns {{ remaining: () => number, expired: () => boolean, signal: AbortSignal }}
   */
  createDeadline(timeout) {
    // TODO: implement on top of `AbortController`.
    throw new NotImplementedError('TimeoutService.createDeadline');
  }

  /**
   * Unconditional delay. Use only where no observable condition exists; prefer `waitFor`.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  async sleep(ms) {
    // TODO: implement as a cancellable timer.
    throw new NotImplementedError('TimeoutService.sleep');
  }
}

export default TimeoutService;
