/**
 * A single published event.
 *
 * Events are pure, serializable data. That matters for two reasons: the same object can be
 * written into a run's log for later inspection, and a subscriber can never mutate engine
 * internals through the payload it receives.
 */
export class Event {
  /**
   * @param {object} init
   * @param {string} init.type            One of `EventTypes`.
   * @param {object} [init.payload]       Structured detail; must be serializable.
   * @param {string} [init.source]        Subsystem that published it, e.g. 'workflow'.
   * @param {string} [init.sessionId]     Session the event belongs to.
   * @param {string} [init.correlationId] Ties related events together, e.g. one step's run.
   * @param {string} [init.id]            Unique event id.
   * @param {string} [init.timestamp]     ISO-8601 publication time.
   */
  constructor({
    type,
    payload = {},
    source = null,
    sessionId = null,
    correlationId = null,
    id = generateEventId(),
    timestamp = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.source = source;
    this.sessionId = sessionId;
    this.correlationId = correlationId;
    this.timestamp = timestamp;
  }

  /**
   * Structural validation. Returns a list of problems; empty means valid.
   * @returns {string[]}
   */
  validate() {
    const errors = [];
    if (!this.type) errors.push('type is required');
    if (this.payload === null || typeof this.payload !== 'object') errors.push('payload must be an object');
    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      source: this.source,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new Event(json);
  }
}

function generateEventId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default Event;
