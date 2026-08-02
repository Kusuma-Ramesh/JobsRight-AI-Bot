import { NotImplementedError } from './WorkflowContext.js';
import { WorkflowState } from './WorkflowState.js';

/**
 * Orchestrates a workflow: owns the run lifecycle, step routing, and state transitions.
 *
 * The engine decides *what happens next*. It never performs an interaction itself — a step
 * names activity ids, and executing those is delegated to the activity framework, which in
 * turn delegates browser work to the browser engine. That separation is strict:
 *
 *     WorkflowEngine  → decides order, branching, retry, and lifecycle
 *     ActivityRunner  → executes one activity, owns per-activity retry and status
 *     BrowserEngine   → performs the actual browser operation
 *
 * The engine therefore contains no selectors, no DOM access, and no knowledge of JobsRight,
 * ChatGPT, or Bulk Job Apply.
 *
 * Every method is a skeleton and throws `NOT_IMPLEMENTED`.
 */
export class WorkflowEngine {
  /**
   * @param {object} [options]
   * @param {object} [options.definition]     Workflow definition: `{ id, name, steps, startStep }`.
   * @param {object} [options.context]        `WorkflowContext` for this run.
   * @param {object} [options.activityRunner] Executes activities; injected, never constructed here.
   * @param {object} [options.store]          Persistence from `v2/workflow/state/`.
   * @param {object} [options.logger]         Structured logger.
   */
  constructor({ definition = null, context = null, activityRunner = null, store = null, logger = null } = {}) {
    this.definition = definition;
    this.context = context;
    this.activityRunner = activityRunner;
    this.store = store;
    this.logger = logger;

    /** @type {string} Current `WorkflowState`. */
    this.state = WorkflowState.Idle;
    /** @type {string[]} Step ids that succeeded, in execution order. */
    this.completedSteps = [];
    /** @type {string[]} Step ids that failed. */
    this.failedSteps = [];
    /** @type {object[]} Serialized failures. */
    this.errors = [];
  }

  /**
   * Begin a run. Triggered by the user's "Start Automation" action; everything after this
   * point is autonomous.
   *
   * @param {object} [options]
   * @param {string} [options.fromStep] Resume at this step instead of the definition's start.
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async start(options) {
    // TODO: transition Idle → Starting, validate the definition (every `nextStep` and
    //       `errorStep` must resolve to a real step), then Starting → Running.
    // TODO: persist the context before the first step so an interrupted run is resumable.
    // TODO: delegate to `executeWorkflow()`.
    throw new NotImplementedError('WorkflowEngine.start');
  }

  /**
   * Request a pause. The run halts at the next step boundary, never mid-activity, so a
   * partially completed interaction is not left in an unknown state.
   * @returns {Promise<void>}
   */
  async pause() {
    // TODO: set a pause flag, let the current step finish, then Running → Paused.
    throw new NotImplementedError('WorkflowEngine.pause');
  }

  /**
   * Continue a paused run from its recorded position.
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async resume() {
    // TODO: verify the state is Paused via `canTransition`, then Paused → Running.
    // TODO: re-validate external preconditions before continuing — tabs may have been
    //       closed or navigated while the run was paused.
    throw new NotImplementedError('WorkflowEngine.resume');
  }

  /**
   * Cancel a run. Terminal: a stopped run cannot be resumed, only started afresh.
   * @param {string} [reason]
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async stop(reason) {
    // TODO: abort in-flight work, transition to Stopped, persist, and return a result.
    throw new NotImplementedError('WorkflowEngine.stop');
  }

  /**
   * Advance to and execute the next step according to the current step's routing.
   * @returns {Promise<import('./WorkflowStep.js').WorkflowStep|null>} Null when the run ended.
   */
  async next() {
    // TODO: resolve `currentStep.nextStep`, update the context, and execute it.
    throw new NotImplementedError('WorkflowEngine.next');
  }

  /**
   * Move back to the previously executed step.
   *
   * Intended for operator-driven recovery, not automatic rollback: stepping back does not
   * undo side effects already performed in the browser, so the engine must refuse to
   * reverse past a step marked non-idempotent.
   *
   * @returns {Promise<import('./WorkflowStep.js').WorkflowStep|null>}
   */
  async previous() {
    // TODO: walk the executed-step history rather than the definition, since branching
    //       means the previous step is not the one before it in declaration order.
    throw new NotImplementedError('WorkflowEngine.previous');
  }

  /**
   * Execute a single step: evaluate its conditions, run its activities in order, apply its
   * retry policy, and choose the next route.
   *
   * @param {string|import('./WorkflowStep.js').WorkflowStep} step Step or step id.
   * @returns {Promise<{ stepId: string, success: boolean, nextStepId: string|null }>}
   */
  async executeStep(step) {
    // TODO: evaluate `step.conditions` against `context.variables`; skip and route to
    //       `nextStep` when a guard is false.
    // TODO: for each activity id, load the activity and hand it to `activityRunner.run`;
    //       write each result's payload into the context before the next activity.
    // TODO: apply `step.retryPolicy` around the whole step, distinct from an activity's
    //       own `retries`.
    // TODO: route to `errorStep` on failure, or fail the run when no error path exists.
    // TODO: persist the context after the step, before following the route.
    throw new NotImplementedError('WorkflowEngine.executeStep');
  }

  /**
   * Drive steps from the current position until the run reaches a terminal state.
   * @returns {Promise<import('./WorkflowResult.js').WorkflowResult>}
   */
  async executeWorkflow() {
    // TODO: loop `executeStep` following routing until no next step remains, a step fails
    //       with no error path, or a pause/stop is requested.
    // TODO: guard against routing cycles with a step-visit budget, so a loop in the
    //       definition cannot run forever.
    // TODO: build the `WorkflowResult` from completedSteps, failedSteps, errors, duration.
    throw new NotImplementedError('WorkflowEngine.executeWorkflow');
  }

  /**
   * The step currently in progress, or null before the run starts.
   * @returns {import('./WorkflowStep.js').WorkflowStep|null}
   */
  getCurrentStep() {
    // TODO: resolve `context.currentStep` against the definition.
    throw new NotImplementedError('WorkflowEngine.getCurrentStep');
  }

  /**
   * The current lifecycle state.
   * @returns {string} One of `WorkflowState`.
   */
  getCurrentState() {
    // TODO: return `this.state`; kept as a method so state can later be read from the
    //       persistent store rather than memory.
    throw new NotImplementedError('WorkflowEngine.getCurrentState');
  }
}

export default WorkflowEngine;
