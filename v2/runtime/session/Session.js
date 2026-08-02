import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * Lifecycle states of an automation session.
 * Mirrors `WorkflowState` deliberately but is not the same thing: a session can exist
 * before any workflow starts, and outlives the workflow it ran.
 */
export const SessionStatus = Object.freeze({
  Created: 'Created',
  Running: 'Running',
  Paused: 'Paused',
  Completed: 'Completed',
  Failed: 'Failed',
  Stopped: 'Stopped'
});

/**
 * One user-initiated automation session, from "Start Automation" to a persisted result.
 *
 * A session is the top-level unit of work and the correlation key for everything a run
 * produces: state snapshots, events, log entries, and files under `v2/data/`. It is mostly
 * pure data so it can be persisted and rehydrated; the behavior lives in `SessionManager`.
 *
 * `browserContext` holds a *reference* to the browser engine's context, not a live browser
 * handle, so the serialized form stays free of unserializable objects.
 */
export class Session {
  /**
   * @param {object} init
   * @param {string} [init.sessionId]      Unique id; correlates logs, events, and artifacts.
   * @param {string} [init.startTime]      ISO-8601 time the session began.
   * @param {string|null} [init.endTime]   ISO-8601 time it reached a terminal status.
   * @param {string} [init.status]         One of `SessionStatus`.
   * @param {object|null} [init.activeWorkflow] `{ workflowId, currentStep }` while running.
   * @param {object|null} [init.browserContext] Reference to the engine's context:
   *                                       `{ runId, boundTabs }`. Never a live handle.
   * @param {object} [init.artifacts]      Logical name -> path under `v2/data/`.
   * @param {object} [init.metadata]       Free-form detail (trigger, version).
   */
  constructor({
    sessionId = generateSessionId(),
    startTime = new Date().toISOString(),
    endTime = null,
    status = SessionStatus.Created,
    activeWorkflow = null,
    browserContext = null,
    artifacts = {},
    metadata = {}
  } = {}) {
    this.sessionId = sessionId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.activeWorkflow = activeWorkflow;
    this.browserContext = browserContext;
    this.artifacts = artifacts;
    this.metadata = metadata;
  }

  /** @returns {boolean} True when the session can no longer progress. */
  isTerminal() {
    return [SessionStatus.Completed, SessionStatus.Failed, SessionStatus.Stopped].includes(this.status);
  }

  /** @returns {number|null} Elapsed milliseconds, or null while still running. */
  getDuration() {
    if (!this.endTime) return null;
    return Date.parse(this.endTime) - Date.parse(this.startTime);
  }

  /**
   * Move the session to a new status.
   * @param {string} status One of `SessionStatus`.
   * @returns {void}
   */
  transitionTo(status) {
    // TODO: validate the transition and stamp `endTime` when it becomes terminal.
    throw new NotImplementedError('Session.transitionTo');
  }

  /**
   * Record a file produced during the session.
   * @param {string} name Logical name, e.g. 'tailoredResume'.
   * @param {string} path Path under `v2/data/`.
   * @returns {void}
   */
  addArtifact(name, path) {
    // TODO: implement; store the path only, never file contents.
    throw new NotImplementedError('Session.addArtifact');
  }

  /**
   * Attach the workflow this session is executing.
   * @param {object} workflow `{ workflowId, currentStep }`
   * @returns {void}
   */
  attachWorkflow(workflow) {
    // TODO: implement; reject attaching a second workflow to a running session.
    throw new NotImplementedError('Session.attachWorkflow');
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      activeWorkflow: this.activeWorkflow,
      browserContext: this.browserContext,
      artifacts: this.artifacts,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new Session(json);
  }
}

function generateSessionId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `session-${globalThis.crypto.randomUUID()}`;
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export default Session;
