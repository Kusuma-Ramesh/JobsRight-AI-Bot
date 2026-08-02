/**
 * Lifecycle states of a workflow run.
 *
 * Idle      -> constructed, never started
 * Starting  -> preconditions being verified (engine init, tabs discovered)
 * Running   -> executing steps
 * Paused    -> halted between steps, resumable in place
 * Completed -> every step reached a terminal success
 * Failed    -> a step failed with no error path left to take
 * Stopped   -> deliberately cancelled by the user
 */
export const WorkflowState = Object.freeze({
  Idle: 'Idle',
  Starting: 'Starting',
  Running: 'Running',
  Paused: 'Paused',
  Completed: 'Completed',
  Failed: 'Failed',
  Stopped: 'Stopped'
});

/** States from which a run cannot continue. */
export const TERMINAL_WORKFLOW_STATES = Object.freeze([
  WorkflowState.Completed,
  WorkflowState.Failed,
  WorkflowState.Stopped
]);

/**
 * Legal transitions. The engine must consult this rather than assigning state freely:
 * an un-modelled transition (resuming a stopped run, pausing a completed one) is the
 * kind of bug that silently corrupts a resumed run.
 */
export const WORKFLOW_TRANSITIONS = Object.freeze({
  [WorkflowState.Idle]: [WorkflowState.Starting, WorkflowState.Stopped],
  [WorkflowState.Starting]: [WorkflowState.Running, WorkflowState.Failed, WorkflowState.Stopped],
  [WorkflowState.Running]: [WorkflowState.Paused, WorkflowState.Completed, WorkflowState.Failed, WorkflowState.Stopped],
  [WorkflowState.Paused]: [WorkflowState.Running, WorkflowState.Stopped],
  [WorkflowState.Completed]: [],
  [WorkflowState.Failed]: [],
  [WorkflowState.Stopped]: []
});

export function isWorkflowState(value) {
  return Object.prototype.hasOwnProperty.call(WorkflowState, value);
}

export function isTerminalWorkflowState(value) {
  return TERMINAL_WORKFLOW_STATES.includes(value);
}

/**
 * Whether moving between two states is allowed.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  return Boolean(WORKFLOW_TRANSITIONS[from]?.includes(to));
}

export default WorkflowState;
