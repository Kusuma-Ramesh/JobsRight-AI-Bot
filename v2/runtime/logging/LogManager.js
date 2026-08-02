import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * Collects, filters, and persists log entries for a session.
 *
 * An automation run is unattended, so its log is the only account of what happened. The
 * manager buffers entries, applies the configured level, writes them to `v2/data/logs/`
 * under the session id, and can subscribe to the `EventBus` so engine events become log
 * entries without either engine knowing a logger exists.
 *
 * Redaction is a hard requirement, not a nicety: entered text, resume contents, and
 * personal data pass through this project constantly and must never reach a log file.
 */
export class LogManager {
  /**
   * @param {object} [options]
   * @param {string} [options.level]     Minimum `LogLevel` to retain.
   * @param {string} [options.sessionId] Correlation key stamped on every entry.
   * @param {object} [options.context]   Base context merged into every entry.
   * @param {object[]} [options.sinks]   Destinations; defaults to the console.
   * @param {object} [options.eventBus]  Bus to mirror entries onto.
   */
  constructor({ level = 'Info', sessionId = null, context = {}, sinks = [], eventBus = null } = {}) {
    this.level = level;
    this.sessionId = sessionId;
    this.context = context;
    this.sinks = sinks;
    this.eventBus = eventBus;
    /** @type {import('./LogEntry.js').LogEntry[]} Entries awaiting a flush. */
    this.buffer = [];
  }

  /**
   * Record an informational entry.
   * @param {string} event Stable event name, not a sentence.
   * @param {object} [data]
   * @returns {void}
   */
  info(event, data) {
    // TODO: delegate to `write(LogLevel.Info, ...)`.
    throw new NotImplementedError('LogManager.info');
  }

  /**
   * Record a warning: something recoverable that a reader should notice.
   * @param {string} event
   * @param {object} [data]
   * @returns {void}
   */
  warn(event, data) {
    // TODO: delegate to `write(LogLevel.Warn, ...)`.
    throw new NotImplementedError('LogManager.warn');
  }

  /**
   * Record a failure.
   * @param {string} event
   * @param {Error|object} [error] Serialized via `toJSON()` when available.
   * @param {object} [data]
   * @returns {void}
   */
  error(event, error, data) {
    // TODO: delegate to `write(LogLevel.Error, ...)` with the serialized error.
    throw new NotImplementedError('LogManager.error');
  }

  /**
   * Record diagnostic detail, retained only when the level allows it.
   * @param {string} event
   * @param {object} [data]
   * @returns {void}
   */
  debug(event, data) {
    // TODO: delegate to `write(LogLevel.Debug, ...)`.
    throw new NotImplementedError('LogManager.debug');
  }

  /**
   * Build an entry, filter it by level, redact it, and dispatch to every sink.
   * @param {string} level
   * @param {string} event
   * @param {object} [data]
   * @param {Error|object} [error]
   * @returns {void}
   */
  write(level, event, data, error) {
    // TODO: construct a `LogEntry`, merge `this.context`, drop it when below `this.level`.
    // TODO: run `redact` before it reaches any sink or buffer.
    // TODO: mirror onto `eventBus` as `EventTypes.LogWritten` when one is configured.
    throw new NotImplementedError('LogManager.write');
  }

  /**
   * Derive a logger that stamps extra context, e.g. `child({ stepId })`.
   * @param {object} context
   * @returns {LogManager}
   */
  child(context) {
    // TODO: implement by merging context and sharing the same sinks and buffer.
    throw new NotImplementedError('LogManager.child');
  }

  /**
   * Mirror `EventBus` traffic into the log, so engine events are recorded without either
   * engine depending on a logger.
   * @param {object} eventBus
   * @returns {() => void} Unsubscribe function.
   */
  attachToEventBus(eventBus) {
    // TODO: subscribe to the relevant namespaces and map each event to an entry.
    throw new NotImplementedError('LogManager.attachToEventBus');
  }

  /**
   * Strip anything that must never be written down.
   * @param {import('./LogEntry.js').LogEntry} entry
   * @returns {import('./LogEntry.js').LogEntry}
   */
  redact(entry) {
    // TODO: remove typed text, file contents, and credential-shaped values; replace them
    //       with a marker so the entry still shows that a value was present.
    throw new NotImplementedError('LogManager.redact');
  }

  /**
   * Write buffered entries to `v2/data/logs/`, one file per session.
   * @returns {Promise<void>}
   */
  async flush() {
    // TODO: implement; flush on session end and periodically, so a crash still leaves a
    //       usable log.
    throw new NotImplementedError('LogManager.flush');
  }

  /**
   * Read buffered entries, for the UI or a run report.
   * @param {object} [filter] `{ level, since, event }`
   * @returns {import('./LogEntry.js').LogEntry[]}
   */
  query(filter) {
    // TODO: implement.
    throw new NotImplementedError('LogManager.query');
  }
}

export default LogManager;
