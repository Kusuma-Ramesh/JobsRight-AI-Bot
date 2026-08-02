import { ActivityStatus, isActivityStatus } from './ActivityStatus.js';
import { ActivityType, isActivityType } from './ActivityType.js';

export const DEFAULT_ACTIVITY_TIMEOUT_MS = 30000;
export const DEFAULT_ACTIVITY_RETRIES = 0;

/**
 * A single, reusable unit of work in the automation engine.
 *
 * An Activity is pure data: it *describes* an interaction, it never performs one.
 * Execution is the ActivityRunner's job. Because an Activity carries no behavior and no
 * site knowledge, the same instance can be serialized into workflow state, replayed, or
 * composed into any workflow.
 */
export class Activity {
  /**
   * @param {object} init
   * @param {string} [init.id]        Unique identifier for this activity instance.
   * @param {string} init.name        Human-readable description of intent.
   * @param {string} init.type        One of `ActivityType`.
   * @param {*}      [init.target]    What the activity acts on (a selector reference,
   *                                  tab reference, or url) — resolved by the runner.
   * @param {object} [init.parameters] Type-specific inputs (text to type, file path,
   *                                  attribute name, scroll offset, ...).
   * @param {number} [init.timeout]   Maximum execution time in milliseconds.
   * @param {number} [init.retries]   Number of retry attempts allowed after a failure.
   * @param {string} [init.status]    One of `ActivityStatus`. Defaults to `Idle`.
   * @param {string} [init.createdAt] ISO-8601 creation timestamp.
   */
  constructor({
    id = generateActivityId(),
    name,
    type,
    target = null,
    parameters = {},
    timeout = DEFAULT_ACTIVITY_TIMEOUT_MS,
    retries = DEFAULT_ACTIVITY_RETRIES,
    status = ActivityStatus.Idle,
    createdAt = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.target = target;
    this.parameters = parameters;
    this.timeout = timeout;
    this.retries = retries;
    this.status = status;
    this.createdAt = createdAt;
  }

  /**
   * Structural validation only. Returns a list of problems; empty means valid.
   * Whether a `target` or a given parameter is required depends on the type, and is
   * enforced by the type handler once execution is implemented.
   */
  validate() {
    const errors = [];
    if (!this.id) errors.push('id is required');
    if (!this.name) errors.push('name is required');
    if (!isActivityType(this.type)) errors.push(`type must be one of ActivityType, got "${this.type}"`);
    if (!isActivityStatus(this.status)) errors.push(`status must be one of ActivityStatus, got "${this.status}"`);
    if (!Number.isFinite(this.timeout) || this.timeout <= 0) errors.push('timeout must be a positive number');
    if (!Number.isInteger(this.retries) || this.retries < 0) errors.push('retries must be a non-negative integer');
    if (this.parameters === null || typeof this.parameters !== 'object') errors.push('parameters must be an object');
    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }

  withStatus(status) {
    return new Activity({ ...this.toJSON(), status });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      target: this.target,
      parameters: this.parameters,
      timeout: this.timeout,
      retries: this.retries,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromJSON(json) {
    return new Activity(json);
  }
}

function generateActivityId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `activity-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export { ActivityStatus, ActivityType };
export default Activity;
