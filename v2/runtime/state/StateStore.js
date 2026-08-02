import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * Durable persistence for session state.
 *
 * The store is what turns a run from a fire-and-forget script into something inspectable
 * and resumable. Its central rule: **write state before performing an irreversible side
 * effect**, so a crash between the two causes a repeated read, never a duplicate
 * submission.
 *
 * The backend is injected. Chrome extension storage is the expected default, but nothing
 * here assumes it — that keeps the runtime testable without a browser.
 */
export class StateStore {
  /**
   * @param {object} [options]
   * @param {object} [options.backend]  Key/value backend; defaults to extension storage.
   * @param {string} [options.namespace] Key prefix isolating this store's data.
   * @param {object} [options.eventBus] Publishes `StateSaved` / `StateRestored`.
   * @param {object} [options.logger]   `LogManager` instance.
   */
  constructor({ backend = null, namespace = 'v2.runtime', eventBus = null, logger = null } = {}) {
    this.backend = backend;
    this.namespace = namespace;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  /**
   * Persist state for a session, replacing what was stored before.
   *
   * @param {string} sessionId
   * @param {object} state Serializable state; paths to files, never file contents.
   * @returns {Promise<void>}
   * @throws {RuntimeError} `STATE_WRITE_FAILED`
   */
  async save(sessionId, state) {
    // TODO: validate serializability before writing — a silent failure here loses the
    //       ability to resume, which is the store's whole purpose.
    // TODO: stamp the schema version, write atomically, publish `EventTypes.StateSaved`.
    throw new NotImplementedError('StateStore.save');
  }

  /**
   * Load the most recently saved state for a session.
   *
   * @param {string} sessionId
   * @returns {Promise<object>}
   * @throws {RuntimeError} `STATE_NOT_FOUND` or `STATE_VERSION_MISMATCH`
   */
  async restore(sessionId) {
    // TODO: read, check the schema version, and migrate or reject an older one rather
    //       than resuming against a shape the code no longer understands.
    // TODO: publish `EventTypes.StateRestored`.
    throw new NotImplementedError('StateStore.restore');
  }

  /**
   * Capture an immutable point-in-time snapshot, appended to the session's chain.
   *
   * @param {string} sessionId
   * @param {object} [options] `{ label }`
   * @returns {Promise<import('./StateSnapshot.js').StateSnapshot>}
   */
  async snapshot(sessionId, options) {
    // TODO: build a `StateSnapshot` from current state, link `previousId`, and persist it.
    // TODO: enforce a retention limit so a long run cannot grow storage without bound.
    throw new NotImplementedError('StateStore.snapshot');
  }

  /**
   * Delete stored state.
   *
   * @param {string} [sessionId] Clears one session, or everything in the namespace when
   *                             omitted.
   * @returns {Promise<void>}
   */
  async clear(sessionId) {
    // TODO: implement; never clear an active session's state.
    throw new NotImplementedError('StateStore.clear');
  }

  /**
   * List a session's snapshots, oldest first.
   * @param {string} sessionId
   * @returns {Promise<import('./StateSnapshot.js').StateSnapshot[]>}
   */
  async listSnapshots(sessionId) {
    // TODO: implement.
    throw new NotImplementedError('StateStore.listSnapshots');
  }

  /**
   * Restore a session to a specific snapshot.
   *
   * Restores recorded state only; it does not undo browser side effects already performed,
   * so callers must treat the result as a starting point, not a rollback.
   *
   * @param {string} snapshotId
   * @returns {Promise<object>}
   */
  async restoreSnapshot(snapshotId) {
    // TODO: implement, rejecting a snapshot whose version cannot be migrated.
    throw new NotImplementedError('StateStore.restoreSnapshot');
  }
}

export default StateStore;
