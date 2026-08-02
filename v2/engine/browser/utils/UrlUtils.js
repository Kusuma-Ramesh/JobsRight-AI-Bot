import { NotImplementedError } from './Errors.js';

/**
 * Url helpers used to recognise tabs and detect navigation.
 *
 * The engine constantly answers "is this the tab I want?" and "did the page navigate?".
 * Both questions are url comparisons, and both are wrong if done with plain string equality:
 * tracking parameters, trailing slashes, and hash changes all produce false negatives.
 * These helpers centralise those rules. They contain no list of known sites.
 */
export const UrlUtils = {
  /**
   * Parse a url, returning null instead of throwing on malformed input.
   * @param {string} url
   * @returns {URL|null}
   */
  parse(url) {
    // TODO: implement with a try/catch around `new URL(url)`.
    throw new NotImplementedError('UrlUtils.parse');
  },

  /**
   * Canonical form used for comparisons: lowercased host, no trailing slash,
   * no hash, and volatile query parameters removed.
   * @param {string} url
   * @param {object} [options]
   * @param {string[]} [options.stripParams] Query params to drop before comparing.
   * @returns {string}
   */
  normalize(url, options) {
    // TODO: implement.
    throw new NotImplementedError('UrlUtils.normalize');
  },

  /**
   * Whether two urls point at the same resource once normalized.
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  isSame(a, b) {
    // TODO: implement on top of `normalize`.
    throw new NotImplementedError('UrlUtils.isSame');
  },

  /**
   * Whether a url matches a pattern. Supports exact urls, origin prefixes, and
   * wildcard match patterns so callers never hand-roll regular expressions.
   * @param {string} url
   * @param {string} pattern
   * @returns {boolean}
   */
  matches(url, pattern) {
    // TODO: implement wildcard-to-regex translation.
    throw new NotImplementedError('UrlUtils.matches');
  },

  /**
   * Origin of a url, or null when unparseable.
   * @param {string} url
   * @returns {string|null}
   */
  getOrigin(url) {
    // TODO: implement.
    throw new NotImplementedError('UrlUtils.getOrigin');
  },

  /**
   * Whether the difference between two urls is only the fragment, meaning the document
   * did not actually reload.
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  isHashOnlyChange(a, b) {
    // TODO: implement.
    throw new NotImplementedError('UrlUtils.isHashOnlyChange');
  }
};

export default UrlUtils;
