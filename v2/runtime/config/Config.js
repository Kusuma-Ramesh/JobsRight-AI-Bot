/**
 * An immutable, validated configuration set for one session.
 *
 * Configuration is resolved once at session start and then frozen. A value that changes
 * mid-run — a timeout, a data path — would make a run irreproducible and its logs
 * misleading, so changes produce a *new* `Config` rather than mutating this one.
 */

/** Engine-wide defaults. Every tunable the runtime reads has an entry here. */
export const DEFAULT_CONFIG = Object.freeze({
  timeouts: Object.freeze({
    activity: 30000,
    page: 45000,
    element: 15000,
    download: 120000
  }),
  retries: Object.freeze({
    maxAttempts: 3,
    strategy: 'Exponential',
    baseDelay: 500,
    maxDelay: 10000
  }),
  paths: Object.freeze({
    resumes: 'v2/data/resumes',
    screenshots: 'v2/data/screenshots',
    logs: 'v2/data/logs',
    temp: 'v2/data/temp'
  }),
  logging: Object.freeze({
    level: 'Info',
    persist: true
  }),
  session: Object.freeze({
    snapshotEveryStep: true,
    maxSnapshots: 200
  })
});

export class Config {
  /**
   * @param {object} [values] Overrides merged over `DEFAULT_CONFIG`.
   * @param {string} [source] Where the values came from, e.g. 'defaults', 'user'.
   */
  constructor(values = {}, source = 'defaults') {
    this.values = deepFreeze({ ...DEFAULT_CONFIG, ...values });
    this.source = source;
  }

  /**
   * Read a value by dotted path, e.g. `get('timeouts.page')`.
   * @param {string} path
   * @param {*} [fallback]
   * @returns {*}
   */
  get(path, fallback) {
    const value = String(path)
      .split('.')
      .reduce((current, key) => (current == null ? undefined : current[key]), this.values);
    return value === undefined ? fallback : value;
  }

  /**
   * @param {string} path
   * @returns {boolean}
   */
  has(path) {
    return this.get(path, undefined) !== undefined;
  }

  /**
   * Derive a new `Config` with overrides applied. This instance is unchanged.
   * @param {object} overrides
   * @param {string} [source]
   * @returns {Config}
   */
  withOverrides(overrides, source = 'override') {
    return new Config({ ...this.values, ...overrides }, source);
  }

  toJSON() {
    return { values: this.values, source: this.source };
  }

  static fromJSON(json) {
    return new Config(json?.values, json?.source);
  }
}

function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) deepFreeze(value);
  }
  return Object.freeze(object);
}

export default Config;
