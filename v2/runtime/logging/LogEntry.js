/** Severity levels, ordered from most to least verbose. */
export const LogLevel = Object.freeze({
  Debug: 'Debug',
  Info: 'Info',
  Warn: 'Warn',
  Error: 'Error'
});

/** Numeric ranks, so a manager can filter by minimum level. */
export const LOG_LEVEL_RANK = Object.freeze({
  [LogLevel.Debug]: 10,
  [LogLevel.Info]: 20,
  [LogLevel.Warn]: 30,
  [LogLevel.Error]: 40
});

/**
 * One structured log record.
 *
 * Entries carry a stable `event` name plus machine-readable `data`, not an interpolated
 * sentence. An autonomous run produces thousands of these, and they are only useful if they
 * can be filtered and correlated — by `sessionId`, by step, by event name.
 */
export class LogEntry {
  /**
   * @param {object} init
   * @param {string} init.level          One of `LogLevel`.
   * @param {string} init.event          Stable event name, e.g. 'session.started'.
   * @param {object} [init.data]         Structured detail.
   * @param {string} [init.sessionId]    Session correlation key.
   * @param {string} [init.source]       Subsystem that logged it.
   * @param {object|null} [init.error]   Serialized error, when the entry reports a failure.
   * @param {string} [init.timestamp]    ISO-8601 time.
   */
  constructor({
    level = LogLevel.Info,
    event,
    data = {},
    sessionId = null,
    source = null,
    error = null,
    timestamp = new Date().toISOString()
  } = {}) {
    this.level = level;
    this.event = event;
    this.data = data;
    this.sessionId = sessionId;
    this.source = source;
    this.error = error;
    this.timestamp = timestamp;
  }

  /**
   * Whether this entry meets a minimum severity.
   * @param {string} minimum One of `LogLevel`.
   * @returns {boolean}
   */
  meets(minimum) {
    return (LOG_LEVEL_RANK[this.level] ?? 0) >= (LOG_LEVEL_RANK[minimum] ?? 0);
  }

  /**
   * Single-line rendering for a console sink.
   * @returns {string}
   */
  format() {
    return `${this.timestamp} [${this.level}] ${this.source ?? '-'} ${this.event}`;
  }

  toJSON() {
    return {
      level: this.level,
      event: this.event,
      data: this.data,
      sessionId: this.sessionId,
      source: this.source,
      error: this.error,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new LogEntry(json);
  }
}

export default LogEntry;
