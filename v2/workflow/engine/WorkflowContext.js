/**
 * The per-run data carrier passed between steps.
 *
 * The context is what makes a workflow resumable: it is serializable data only, so a run
 * can be persisted after every step and rehydrated later. Steps never talk to each other
 * directly — one writes a variable, a later one reads it — which is why a step can be
 * reordered or re-run without hidden coupling.
 *
 * It holds no engines, managers, or live browser handles. Those are injected into the
 * runner, not stored here.
 */
export class WorkflowContext {
  /**
   * @param {object} init
   * @param {string} [init.sessionId]   Identifies one user-initiated automation session.
   * @param {string} [init.workflowId]  Identifies the workflow definition being executed.
   * @param {string|null} [init.currentStep] Id of the step in progress.
   * @param {object} [init.variables]   Data produced and consumed by steps.
   * @param {object} [init.artifacts]   Paths to files under `v2/data/`, never file contents.
   * @param {object} [init.timestamps]  `{ createdAt, startedAt, pausedAt, resumedAt, endedAt }`.
   */
  constructor({
    sessionId = null,
    workflowId = null,
    currentStep = null,
    variables = {},
    artifacts = {},
    timestamps = {}
  } = {}) {
    this.sessionId = sessionId;
    this.workflowId = workflowId;
    this.currentStep = currentStep;
    this.variables = variables;
    this.artifacts = artifacts;
    this.timestamps = { createdAt: new Date().toISOString(), ...timestamps };
  }

  /**
   * Read a variable produced by an earlier step.
   * @param {string} key
   * @param {*} [fallback]
   * @returns {*}
   */
  get(key, fallback) {
    // TODO: implement; reading an unset key without a fallback should be an explicit
    //       failure rather than silently yielding undefined into an activity.
    throw new NotImplementedError('WorkflowContext.get');
  }

  /**
   * Record a variable for later steps.
   * @param {string} key
   * @param {*} value Must be serializable; the context is persisted after every step.
   * @returns {void}
   */
  set(key, value) {
    // TODO: implement, rejecting non-serializable values at write time.
    throw new NotImplementedError('WorkflowContext.set');
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    // TODO: implement.
    throw new NotImplementedError('WorkflowContext.has');
  }

  /**
   * Register a file produced during the run.
   * @param {string} name Logical name, e.g. 'tailoredResume'.
   * @param {string} path Path under `v2/data/`.
   * @returns {void}
   */
  addArtifact(name, path) {
    // TODO: implement; store the path only, never the contents.
    throw new NotImplementedError('WorkflowContext.addArtifact');
  }

  /**
   * Stamp a lifecycle moment, e.g. `mark('startedAt')`.
   * @param {string} name
   * @returns {void}
   */
  mark(name) {
    // TODO: implement with an ISO-8601 timestamp.
    throw new NotImplementedError('WorkflowContext.mark');
  }

  /**
   * Advance the recorded position in the workflow.
   * @param {string|null} stepId
   * @returns {void}
   */
  setCurrentStep(stepId) {
    // TODO: implement; the caller persists the context afterwards so a resumed run
    //       restarts at the right step.
    throw new NotImplementedError('WorkflowContext.setCurrentStep');
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      workflowId: this.workflowId,
      currentStep: this.currentStep,
      variables: this.variables,
      artifacts: this.artifacts,
      timestamps: this.timestamps
    };
  }

  static fromJSON(json) {
    return new WorkflowContext(json);
  }
}

/**
 * Marker error thrown by every skeleton method in the workflow engine.
 * Exported so the engine and runner share one definition; it moves to `v2/shared`
 * once the shared error types land.
 */
export class NotImplementedError extends Error {
  /** @param {string} method Fully qualified method name, e.g. `WorkflowEngine.start`. */
  constructor(method) {
    super(`${method} is not implemented`);
    this.name = 'NotImplementedError';
    this.code = 'NOT_IMPLEMENTED';
    this.method = method;
  }
}

export default WorkflowContext;
