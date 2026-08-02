import { NotImplementedError } from './../utils/Errors.js';

/** Named backoff strategies available to retry policies. */
export const BackoffStrategy = Object.freeze({
  Fixed: 'Fixed',
  Linear: 'Linear',
  Exponential: 'Exponential'
});

/**
 * Centralised retry policy for engine operations.
 *
 * Retrying is only safe when two things are true: the failure is recoverable, and the
 * operation is safe to repeat. This service owns the first judgement (via the error's
 * `recoverable` flag) and forces the caller to state the second. Blind retrying of a
 * submit-shaped action is how automations double-apply, so `retryable` is explicit.
 */
export class RetryService {
  /**
   * @param {object} [options]
   * @param {number} [options.maxAttempts] Total attempts including the first.
   * @param {string} [options.strategy]    One of `BackoffStrategy`.
   * @param {number} [options.baseDelay]   First backoff delay in milliseconds.
   * @param {number} [options.maxDelay]    Upper bound for any single backoff delay.
   * @param {number} [options.jitter]      0..1 randomisation factor applied to each delay.
   * @param {object} [options.logger]      `Logger` instance.
   */
  constructor({ maxAttempts = 3, strategy = BackoffStrategy.Exponential, baseDelay = 500, maxDelay = 10000, jitter = 0.2, logger = null } = {}) {
    this.maxAttempts = maxAttempts;
    this.strategy = strategy;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.jitter = jitter;
    this.logger = logger;
  }

  /**
   * Execute an operation, retrying while the error is recoverable and attempts remain.
   *
   * @param {(attempt: number) => Promise<*>} operation
   * @param {object} [options]
   * @param {number} [options.maxAttempts]
   * @param {(error: unknown, attempt: number) => boolean} [options.shouldRetry]
   *        Overrides the default `isRecoverable` check.
   * @param {string} [options.description] Used in logs.
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<*>} The operation's value.
   * @throws The last error when every attempt fails.
   */
  async execute(operation, options) {
    // TODO: implement the attempt loop, defaulting `shouldRetry` to `isRecoverable`.
    // TODO: stop immediately on a non-recoverable error rather than exhausting attempts.
    // TODO: honour `signal` so an aborted run does not keep retrying.
    // TODO: log every retry with attempt number, delay, and error code.
    throw new NotImplementedError('RetryService.execute');
  }

  /**
   * Compute the delay before a given attempt.
   * @param {number} attempt 1-based number of the attempt about to be made.
   * @returns {number} Delay in milliseconds, capped at `maxDelay`.
   */
  computeDelay(attempt) {
    // TODO: implement per `this.strategy`, then apply jitter and the cap.
    throw new NotImplementedError('RetryService.computeDelay');
  }

  /**
   * Whether an operation may be repeated at all. Non-idempotent operations
   * (submitting a form, starting a bulk run) must declare `retryable: false`.
   *
   * @param {object} descriptor `{ retryable: boolean }`
   * @returns {boolean}
   */
  isOperationRetryable(descriptor) {
    // TODO: implement; default to false when unspecified, so unsafe retries need intent.
    throw new NotImplementedError('RetryService.isOperationRetryable');
  }
}

export default RetryService;
