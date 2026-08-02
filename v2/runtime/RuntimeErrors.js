/**
 * Typed errors for the runtime layer.
 *
 * The runtime deliberately does not reuse `v2/engine/browser/utils/Errors.js`: those types
 * descend from `BrowserEngineError` and describe browser failures. A session or config
 * failure is not a browser failure, and the runtime must not depend on the browser engine's
 * error hierarchy to report one.
 */

export const RuntimeErrorCode = Object.freeze({
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_INVALID_STATE: 'SESSION_INVALID_STATE',
  STATE_NOT_FOUND: 'STATE_NOT_FOUND',
  STATE_VERSION_MISMATCH: 'STATE_VERSION_MISMATCH',
  STATE_WRITE_FAILED: 'STATE_WRITE_FAILED',
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_MISSING_KEY: 'CONFIG_MISSING_KEY'
});

export class RuntimeError extends Error {
  /**
   * @param {string} message
   * @param {object} [options]
   * @param {string} [options.code]    One of `RuntimeErrorCode`.
   * @param {object} [options.context] Structured detail for logs.
   * @param {Error}  [options.cause]
   */
  constructor(message, { code = RuntimeErrorCode.NOT_IMPLEMENTED, context = {}, cause = null } = {}) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.context = context;
    this.cause = cause;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, context: this.context };
  }
}

/** Thrown by every skeleton method in the runtime until implementation lands. */
export class NotImplementedError extends RuntimeError {
  /** @param {string} method Fully qualified method name, e.g. `SessionManager.start`. */
  constructor(method) {
    super(`${method} is not implemented`, { code: RuntimeErrorCode.NOT_IMPLEMENTED, context: { method } });
    this.method = method;
  }
}

export default RuntimeError;
