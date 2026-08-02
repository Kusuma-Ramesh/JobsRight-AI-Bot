/**
 * An immutable point-in-time capture of a session's state.
 *
 * Snapshots are what make a run resumable and auditable: one is taken after every step, so
 * an interrupted session restarts from the last known-good position rather than the
 * beginning. Each carries a `version` from the first release, because a stored snapshot
 * must remain readable after the state shape evolves.
 */
export const STATE_SCHEMA_VERSION = 1;

export class StateSnapshot {
  /**
   * @param {object} init
   * @param {string} init.sessionId       Session this snapshot belongs to.
   * @param {object} init.data            Captured state: session, workflow context, progress.
   * @param {number} [init.version]       Schema version of `data`.
   * @param {string} [init.id]            Unique snapshot id.
   * @param {string} [init.createdAt]     ISO-8601 capture time.
   * @param {string} [init.label]         Why it was taken, e.g. 'after-step:collect-jobs'.
   * @param {string|null} [init.previousId] Prior snapshot, forming an ordered chain.
   */
  constructor({
    sessionId,
    data = {},
    version = STATE_SCHEMA_VERSION,
    id = generateSnapshotId(),
    createdAt = new Date().toISOString(),
    label = null,
    previousId = null
  } = {}) {
    this.id = id;
    this.sessionId = sessionId;
    this.data = data;
    this.version = version;
    this.createdAt = createdAt;
    this.label = label;
    this.previousId = previousId;
  }

  /**
   * Structural validation. Returns a list of problems; empty means valid.
   * @returns {string[]}
   */
  validate() {
    const errors = [];
    if (!this.sessionId) errors.push('sessionId is required');
    if (this.data === null || typeof this.data !== 'object') errors.push('data must be an object');
    if (!Number.isInteger(this.version) || this.version < 1) errors.push('version must be a positive integer');
    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }

  /** @returns {boolean} Whether this snapshot was written by the current schema. */
  isCurrentVersion() {
    return this.version === STATE_SCHEMA_VERSION;
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      data: this.data,
      version: this.version,
      createdAt: this.createdAt,
      label: this.label,
      previousId: this.previousId
    };
  }

  static fromJSON(json) {
    return new StateSnapshot(json);
  }
}

function generateSnapshotId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `snapshot-${globalThis.crypto.randomUUID()}`;
  }
  return `snapshot-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default StateSnapshot;
