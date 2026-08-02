/**
 * Lifecycle states an Activity can be in during a run.
 *
 * Idle      -> created, not yet executed
 * Running   -> currently executing
 * Completed -> finished successfully
 * Failed    -> finished unsuccessfully and will not be retried
 * Skipped   -> deliberately not executed
 * Retrying  -> failed, and another attempt is pending
 */
export const ActivityStatus = Object.freeze({
  Idle: 'Idle',
  Running: 'Running',
  Completed: 'Completed',
  Failed: 'Failed',
  Skipped: 'Skipped',
  Retrying: 'Retrying'
});

/** Statuses that mean the activity will not run again. */
export const TERMINAL_ACTIVITY_STATUSES = Object.freeze([
  ActivityStatus.Completed,
  ActivityStatus.Failed,
  ActivityStatus.Skipped
]);

export function isActivityStatus(value) {
  return Object.prototype.hasOwnProperty.call(ActivityStatus, value);
}

export function isTerminalActivityStatus(value) {
  return TERMINAL_ACTIVITY_STATUSES.includes(value);
}

export default ActivityStatus;
