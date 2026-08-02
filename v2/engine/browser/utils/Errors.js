/**
 * Typed error definitions for the browser engine.
 *
 * Errors are part of the engine's public contract: the workflow layer decides whether to
 * retry, skip, or abort based on the error's `code` and its `recoverable` flag, never by
 * matching on message text. Every error thrown by the engine must be one of these types.
 */

/** Stable error codes emitted by the engine. */
export const ErrorCode = Object.freeze({
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  TIMEOUT: 'TIMEOUT',
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  SELECTOR_NOT_REGISTERED: 'SELECTOR_NOT_REGISTERED',
  TAB_NOT_FOUND: 'TAB_NOT_FOUND',
  WINDOW_NOT_FOUND: 'WINDOW_NOT_FOUND',
  PAGE_NOT_READY: 'PAGE_NOT_READY',
  NAVIGATION_FAILED: 'NAVIGATION_FAILED',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  SCREENSHOT_FAILED: 'SCREENSHOT_FAILED',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  ENGINE_NOT_INITIALIZED: 'ENGINE_NOT_INITIALIZED'
});

/**
 * Base class for every engine error.
 *
 * @property {string} code        One of `ErrorCode`.
 * @property {boolean} recoverable Whether retrying the same operation could succeed.
 * @property {object} context     Structured detail for logs (tab id, selector key, ...).
 */
export class BrowserEngineError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {string} [options.code]
   * @param {boolean} [options.recoverable]
   * @param {object} [options.context]
   * @param {Error} [options.cause]
   */
  constructor(message, { code = ErrorCode.NOT_IMPLEMENTED, recoverable = false, context = {}, cause = null } = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.recoverable = recoverable;
    this.context = context;
    this.cause = cause;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, recoverable: this.recoverable, context: this.context };
  }
}

/**
 * Thrown by every skeleton method in this engine until execution is implemented.
 * Its presence in a run is a build-state signal, never a runtime condition to retry.
 */
export class NotImplementedError extends BrowserEngineError {
  /** @param {string} method Fully qualified method name, e.g. `BrowserEngine.click`. */
  constructor(method) {
    super(`${method} is not implemented`, { code: ErrorCode.NOT_IMPLEMENTED, recoverable: false, context: { method } });
  }
}

/** An operation exceeded its allotted time. Usually recoverable. */
export class TimeoutError extends BrowserEngineError {
  constructor(message, context = {}) {
    super(message, { code: ErrorCode.TIMEOUT, recoverable: true, context });
  }
}

/** A selector resolved but matched nothing in the live DOM. Usually recoverable. */
export class ElementNotFoundError extends BrowserEngineError {
  constructor(message, context = {}) {
    super(message, { code: ErrorCode.ELEMENT_NOT_FOUND, recoverable: true, context });
  }
}

/** A selector key was requested that the registry does not know. Never recoverable. */
export class SelectorNotRegisteredError extends BrowserEngineError {
  constructor(message, context = {}) {
    super(message, { code: ErrorCode.SELECTOR_NOT_REGISTERED, recoverable: false, context });
  }
}

/** A referenced tab or window no longer exists. Never recoverable by retry alone. */
export class TargetNotFoundError extends BrowserEngineError {
  constructor(message, { code = ErrorCode.TAB_NOT_FOUND, context = {} } = {}) {
    super(message, { code, recoverable: false, context });
  }
}

/**
 * Decide whether an error justifies another attempt.
 * Non-engine errors are treated as unrecoverable: an unknown failure must not loop.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
export function isRecoverable(error) {
  return error instanceof BrowserEngineError && error.recoverable;
}

export default BrowserEngineError;
