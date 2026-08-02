/**
 * The outcome of a single Activity execution attempt.
 *
 * An ActivityResult is the only thing an ActivityRunner returns. It is a plain,
 * serializable value so it can be written into workflow state and inspected after a run.
 */
export class ActivityResult {
  /**
   * @param {object} init
   * @param {boolean} init.success  Whether the attempt achieved its intent.
   * @param {string}  [init.message] Human-readable summary of what happened.
   * @param {number}  [init.duration] Elapsed execution time in milliseconds.
   * @param {*}       [init.error]   Error detail when `success` is false.
   * @param {*}       [init.payload] Data produced by the activity (read text, attribute,
   *                                 screenshot reference, downloaded file path, ...).
   */
  constructor({ success, message = '', duration = 0, error = null, payload = null } = {}) {
    this.success = Boolean(success);
    this.message = message;
    this.duration = duration;
    this.error = error;
    this.payload = payload;
  }

  static success({ message = '', duration = 0, payload = null } = {}) {
    return new ActivityResult({ success: true, message, duration, payload });
  }

  static failure({ message = '', duration = 0, error = null, payload = null } = {}) {
    return new ActivityResult({ success: false, message, duration, error, payload });
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      duration: this.duration,
      error: this.error,
      payload: this.payload
    };
  }
}

export default ActivityResult;
