import { WorkflowState } from './WorkflowState.js';

/**
 * The outcome of a workflow run.
 *
 * Plain, serializable data written into `v2/workflow/state/` at the end of a run. It
 * records `failedSteps` alongside `completedSteps` and keeps `success` separate from
 * `status`, because a run can finish (`Completed`) while individual steps took their error
 * path — "did it finish" and "did it work" are different questions.
 */
export class WorkflowResult {
  /**
   * @param {object} init
   * @param {boolean} init.success            Whether the run achieved its intent.
   * @param {string} [init.status]            Terminal `WorkflowState`.
   * @param {string[]} [init.completedSteps]  Step ids that succeeded, in execution order.
   * @param {string[]} [init.failedSteps]     Step ids that failed.
   * @param {number} [init.duration]          Total elapsed run time in milliseconds.
   * @param {object[]} [init.errors]          Serialized failures: `{ stepId, code, message }`.
   */
  constructor({
    success,
    status = WorkflowState.Idle,
    completedSteps = [],
    failedSteps = [],
    duration = 0,
    errors = []
  } = {}) {
    this.success = Boolean(success);
    this.status = status;
    this.completedSteps = completedSteps;
    this.failedSteps = failedSteps;
    this.duration = duration;
    this.errors = errors;
  }

  static success({ completedSteps = [], duration = 0, failedSteps = [], errors = [] } = {}) {
    return new WorkflowResult({
      success: true,
      status: WorkflowState.Completed,
      completedSteps,
      failedSteps,
      duration,
      errors
    });
  }

  static failure({ status = WorkflowState.Failed, completedSteps = [], failedSteps = [], duration = 0, errors = [] } = {}) {
    return new WorkflowResult({ success: false, status, completedSteps, failedSteps, duration, errors });
  }

  /** @returns {number} Count of steps that reached a terminal state. */
  get stepCount() {
    return this.completedSteps.length + this.failedSteps.length;
  }

  toJSON() {
    return {
      success: this.success,
      status: this.status,
      completedSteps: this.completedSteps,
      failedSteps: this.failedSteps,
      duration: this.duration,
      errors: this.errors
    };
  }

  static fromJSON(json) {
    return new WorkflowResult(json);
  }
}

export default WorkflowResult;
