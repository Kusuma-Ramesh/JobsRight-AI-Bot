import { Activity } from './Activity.js';
import { ActivityResult } from './ActivityResult.js';
import { ActivityStatus } from './ActivityStatus.js';

/**
 * Executes a single Activity and returns an ActivityResult.
 *
 * Skeleton only: this file intentionally contains no browser code. The runner owns the
 * execution *contract* — validation, status transitions, timing, retry accounting — while
 * the actual interaction for each ActivityType is delegated to a handler that will be
 * supplied later. That keeps the engine testable without a browser and keeps every
 * site-specific detail out of the workflow layer.
 */
export class ActivityRunner {
  /**
   * @param {object} [options]
   * @param {object} [options.handlers] Map of ActivityType -> executor, injected later.
   * @param {object} [options.logger]   Structured logger from `v2/shared`.
   */
  constructor({ handlers = {}, logger = null } = {}) {
    this.handlers = handlers;
    this.logger = logger;
  }

  /**
   * Run an activity to completion, including any retries it allows.
   *
   * @param {Activity} activity
   * @returns {Promise<ActivityResult>}
   */
  async run(activity) {
    if (!(activity instanceof Activity)) {
      return ActivityResult.failure({ message: 'run() expects an Activity instance' });
    }

    const errors = activity.validate();
    if (errors.length > 0) {
      activity.status = ActivityStatus.Failed;
      return ActivityResult.failure({ message: `Invalid activity: ${errors.join('; ')}` });
    }

    const startedAt = Date.now();
    const maxAttempts = activity.retries + 1;
    let lastResult = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      activity.status = ActivityStatus.Running;
      lastResult = await this.execute(activity, attempt);

      if (lastResult.success) {
        activity.status = ActivityStatus.Completed;
        break;
      }

      const hasAttemptsLeft = attempt < maxAttempts;
      activity.status = hasAttemptsLeft ? ActivityStatus.Retrying : ActivityStatus.Failed;
      // TODO: apply the shared backoff policy from `v2/shared` between attempts.
    }

    lastResult.duration = Date.now() - startedAt;
    return lastResult;
  }

  /**
   * Perform a single execution attempt.
   *
   * @param {Activity} activity
   * @param {number} attempt 1-based attempt number.
   * @returns {Promise<ActivityResult>}
   */
  async execute(activity, attempt) {
    // TODO: resolve `activity.target` (selector reference / tab reference / url) via the
    //       selector registry and browser access helpers in `v2/shared`.
    // TODO: dispatch to `this.handlers[activity.type]` and await the interaction.
    // TODO: enforce `activity.timeout`, cancelling the attempt when it elapses.
    // TODO: classify thrown errors as recoverable or fatal so `run()` can stop retrying
    //       early on a fatal error instead of exhausting all attempts.
    // TODO: emit structured logs (run id, activity id, type, attempt) through `this.logger`.
    return ActivityResult.failure({
      message: `No handler registered for activity type "${activity.type}" (attempt ${attempt})`,
      error: 'NOT_IMPLEMENTED'
    });
  }

  /**
   * Mark an activity as deliberately not executed.
   *
   * @param {Activity} activity
   * @param {string} [reason]
   * @returns {ActivityResult}
   */
  skip(activity, reason = 'Skipped by workflow') {
    activity.status = ActivityStatus.Skipped;
    return ActivityResult.success({ message: reason });
  }
}

export default ActivityRunner;
