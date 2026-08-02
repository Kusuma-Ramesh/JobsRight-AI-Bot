import { NotImplementedError } from './../utils/Errors.js';

/**
 * The engine's lookup table from a stable selector *key* to selector *definitions*.
 *
 * Activities and controllers refer to targets by key (`'jobsright.jobCard.title'`), never by
 * CSS string. That indirection is the whole point: when a site changes its markup, the fix
 * is a registry entry, not a code change — and the engine stays free of site knowledge.
 *
 * This file is the mechanism only. The actual selector data lives in `v2/selectors/` and is
 * registered into an instance at startup.
 */

/** How a selector definition should be interpreted. */
export const SelectorKind = Object.freeze({
  Css: 'Css',
  XPath: 'XPath',
  Text: 'Text',
  Role: 'Role',
  TestId: 'TestId'
});

export class SelectorRegistry {
  /**
   * @param {object} [options]
   * @param {object} [options.definitions] Initial `key -> definition` map.
   * @param {object} [options.logger]      `Logger` instance.
   */
  constructor({ definitions = {}, logger = null } = {}) {
    this.definitions = new Map(Object.entries(definitions));
    this.logger = logger;
  }

  /**
   * Register or replace one selector definition.
   *
   * A definition is an ordered list of candidates, best first, so the resolver can fall
   * back when the primary markup changes:
   * `{ key, candidates: [{ kind, value, description }], lastVerified }`
   *
   * @param {string} key
   * @param {object} definition
   * @returns {void}
   */
  register(key, definition) {
    // TODO: validate the definition shape and reject unknown `kind` values.
    throw new NotImplementedError('SelectorRegistry.register');
  }

  /**
   * Register a namespaced group of definitions in one call, e.g. all of one application's.
   * @param {string} namespace
   * @param {object} definitions
   * @returns {void}
   */
  registerAll(namespace, definitions) {
    // TODO: implement, prefixing each key with `namespace`.
    throw new NotImplementedError('SelectorRegistry.registerAll');
  }

  /**
   * Look up a definition.
   * @param {string} key
   * @returns {object}
   * @throws {SelectorNotRegisteredError} When the key is unknown.
   */
  get(key) {
    // TODO: implement; an unknown key is a programming error, never a retryable failure.
    throw new NotImplementedError('SelectorRegistry.get');
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    // TODO: implement.
    throw new NotImplementedError('SelectorRegistry.has');
  }

  /**
   * List registered keys, optionally filtered by namespace prefix.
   * @param {string} [namespace]
   * @returns {string[]}
   */
  keys(namespace) {
    // TODO: implement.
    throw new NotImplementedError('SelectorRegistry.keys');
  }

  /**
   * Record that a candidate worked or failed, so fragile selectors surface in reports
   * instead of being rediscovered during the next broken run.
   *
   * @param {string} key
   * @param {number} candidateIndex
   * @param {boolean} matched
   * @returns {void}
   */
  recordOutcome(key, candidateIndex, matched) {
    // TODO: implement lightweight health tracking per candidate.
    throw new NotImplementedError('SelectorRegistry.recordOutcome');
  }
}

export default SelectorRegistry;
