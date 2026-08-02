import { NotImplementedError } from './../utils/Errors.js';

/** Severity levels, ordered from most to least verbose. */
export const LogLevel = Object.freeze({
  Debug: 'Debug',
  Info: 'Info',
  Warn: 'Warn',
  Error: 'Error'
});

/**
 * Structured, run-scoped logging for the engine.
 *
 * Every entry carries machine-readable context (run id, activity id, tab id) rather than
 * an interpolated sentence, so a whole run can be traced and filtered after the fact. This
 * is the engine's own logger; it is not a workflow feature module.
 */
export class Logger {
  /**
   * @param {object} [options]
   * @param {string} [options.level]   Minimum level to emit; defaults to `Info`.
   * @param {object} [options.context] Base context merged into every entry.
   * @param {object} [options.sink]    Destination for entries; defaults to the console.
   */
  constructor({ level = LogLevel.Info, context = {}, sink = null } = {}) {
    this.level = level;
    this.context = context;
    this.sink = sink;
  }

  /**
   * Derive a logger that adds fixed context to every entry, e.g. `child({ activityId })`.
   * @param {object} context
   * @returns {Logger}
   */
  child(context) {
    // TODO: implement by merging `this.context` with `context`.
    throw new NotImplementedError('Logger.child');
  }

  /**
   * Emit an entry if it meets the configured level.
   * @param {string} level One of `LogLevel`.
   * @param {string} event Stable event name, not a sentence (e.g. 'tab.switched').
   * @param {object} [data] Structured detail.
   * @returns {void}
   */
  log(level, event, data) {
    // TODO: implement level filtering, timestamping, and dispatch to `this.sink`.
    // TODO: redact anything credential-shaped before it reaches a sink.
    throw new NotImplementedError('Logger.log');
  }

  debug(event, data) {
    // TODO: delegate to `log(LogLevel.Debug, ...)`.
    throw new NotImplementedError('Logger.debug');
  }

  info(event, data) {
    // TODO: delegate to `log(LogLevel.Info, ...)`.
    throw new NotImplementedError('Logger.info');
  }

  warn(event, data) {
    // TODO: delegate to `log(LogLevel.Warn, ...)`.
    throw new NotImplementedError('Logger.warn');
  }

  /**
   * @param {string} event
   * @param {Error|object} [error] Serialized via `toJSON()` when it is an engine error.
   * @param {object} [data]
   */
  error(event, error, data) {
    // TODO: delegate to `log(LogLevel.Error, ...)` with the serialized error.
    throw new NotImplementedError('Logger.error');
  }

  /**
   * Persist buffered entries to `v2/data/logs/`.
   * @returns {Promise<void>}
   */
  async flush() {
    // TODO: implement; write one file per run id.
    throw new NotImplementedError('Logger.flush');
  }
}

export default Logger;
