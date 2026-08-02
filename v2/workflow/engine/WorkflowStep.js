/**
 * One node in a workflow.
 *
 * A step is pure data describing *what should happen* and *where to go next* — it holds no
 * behavior and performs nothing. Because next/error routing is stored on the step rather
 * than implied by array order, a workflow is a graph: it can branch, loop, and route
 * failures to a recovery path without the engine hard-coding any sequence.
 *
 * A step never references a browser, a selector, or an application. It references activity
 * ids; the activities describe the interactions.
 */
export class WorkflowStep {
  /**
   * @param {object} init
   * @param {string} init.id                 Unique within the workflow; routing targets it.
   * @param {string} init.name               Human-readable intent.
   * @param {string[]} [init.activityIds]    Activities to execute, in order.
   * @param {object[]} [init.conditions]     Guards evaluated before running; when any is
   *                                         false the step is skipped and routing follows
   *                                         `nextStep`. Shape: `{ variable, operator, value }`.
   * @param {string|null} [init.nextStep]    Step id to run on success; null ends the run.
   * @param {string|null} [init.errorStep]   Step id to run on failure; null fails the run.
   * @param {object} [init.retryPolicy]      Step-level retry: `{ maxAttempts, strategy, baseDelay }`.
   *                                         Distinct from an activity's own `retries`.
   */
  constructor({
    id,
    name,
    activityIds = [],
    conditions = [],
    nextStep = null,
    errorStep = null,
    retryPolicy = null
  } = {}) {
    this.id = id;
    this.name = name;
    this.activityIds = activityIds;
    this.conditions = conditions;
    this.nextStep = nextStep;
    this.errorStep = errorStep;
    this.retryPolicy = retryPolicy;
  }

  /**
   * Structural validation only. Returns a list of problems; empty means valid.
   * Whether `nextStep` and `errorStep` point at existing steps is a whole-workflow
   * question, checked by the engine when the definition is loaded.
   *
   * @returns {string[]}
   */
  validate() {
    const errors = [];
    if (!this.id) errors.push('id is required');
    if (!this.name) errors.push('name is required');
    if (!Array.isArray(this.activityIds)) errors.push('activityIds must be an array');
    if (!Array.isArray(this.conditions)) errors.push('conditions must be an array');
    if (this.retryPolicy !== null && typeof this.retryPolicy !== 'object') {
      errors.push('retryPolicy must be an object or null');
    }
    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }

  /** @returns {boolean} True when success routing ends the workflow. */
  isTerminal() {
    return this.nextStep === null;
  }

  /** @returns {boolean} True when this step has a recovery path. */
  hasErrorPath() {
    return this.errorStep !== null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      activityIds: this.activityIds,
      conditions: this.conditions,
      nextStep: this.nextStep,
      errorStep: this.errorStep,
      retryPolicy: this.retryPolicy
    };
  }

  static fromJSON(json) {
    return new WorkflowStep(json);
  }
}

export default WorkflowStep;
