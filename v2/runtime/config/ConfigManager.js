import { NotImplementedError } from './../RuntimeErrors.js';

/**
 * Resolves, validates, and distributes configuration.
 *
 * Layers are merged in a fixed order — defaults, stored user settings, then per-session
 * overrides — so the effective value of any setting is always explainable. Validation
 * happens once at load: a bad timeout should fail at session start, not thirty steps into
 * an autonomous run.
 *
 * Secrets never live here. Credentials belong in the browser's own session, not in
 * configuration that gets logged and persisted.
 */
export class ConfigManager {
  /**
   * @param {object} [options]
   * @param {object} [options.backend]  Storage for persisted user settings.
   * @param {object} [options.eventBus] Publishes `EventTypes.ConfigChanged`.
   * @param {object} [options.logger]   `LogManager` instance.
   */
  constructor({ backend = null, eventBus = null, logger = null } = {}) {
    this.backend = backend;
    this.eventBus = eventBus;
    this.logger = logger;
    /** @type {import('./Config.js').Config|null} Resolved configuration. */
    this.current = null;
  }

  /**
   * Resolve the effective configuration by merging every layer.
   * @param {object} [overrides] Per-session overrides, highest precedence.
   * @returns {Promise<import('./Config.js').Config>}
   * @throws {RuntimeError} `CONFIG_INVALID`
   */
  async load(overrides) {
    // TODO: merge defaults ← stored settings ← overrides, validate, and cache as `current`.
    throw new NotImplementedError('ConfigManager.load');
  }

  /**
   * Read a value by dotted path from the resolved configuration.
   * @param {string} path
   * @param {*} [fallback]
   * @returns {*}
   * @throws {RuntimeError} `CONFIG_MISSING_KEY` when unset and no fallback is given.
   */
  get(path, fallback) {
    // TODO: implement; fail loudly on a missing key rather than yielding undefined into
    //       a timeout or a file path.
    throw new NotImplementedError('ConfigManager.get');
  }

  /**
   * Persist a user setting. Takes effect for the next session, not the running one.
   * @param {string} path
   * @param {*} value
   * @returns {Promise<void>}
   */
  async set(path, value) {
    // TODO: validate the value against its schema, persist, publish ConfigChanged.
    throw new NotImplementedError('ConfigManager.set');
  }

  /**
   * Check a candidate configuration without applying it.
   * @param {object} values
   * @returns {string[]} Problems found; empty means valid.
   */
  validate(values) {
    // TODO: check types, ranges (positive timeouts, non-negative retries), and that
    //       every path stays inside `v2/data/`.
    throw new NotImplementedError('ConfigManager.validate');
  }

  /**
   * Discard stored user settings and fall back to defaults.
   * @returns {Promise<import('./Config.js').Config>}
   */
  async reset() {
    // TODO: implement.
    throw new NotImplementedError('ConfigManager.reset');
  }

  /**
   * The resolved configuration for the current session.
   * @returns {import('./Config.js').Config}
   */
  getConfig() {
    // TODO: implement; loading must have happened first.
    throw new NotImplementedError('ConfigManager.getConfig');
  }
}

export default ConfigManager;
