/**
 * Url inspection and matching for the detection layer.
 *
 * Recognising a tab is a url comparison, and plain string equality gets it wrong: trailing
 * slashes, `www.`, tracking parameters, and hash fragments all produce false negatives.
 * Every rule for comparing urls lives here so detection behaves consistently.
 *
 * This is inspection only — it reads urls, never navigates. It contains no site knowledge:
 * callers supply the patterns.
 *
 * `v2/engine/browser/utils/UrlUtils.js` remains the declared home for these helpers once
 * the interaction layer needs them too; this implementation is scoped to detection and
 * should be folded in there rather than duplicated.
 */

/** Query parameters dropped before comparison, since they never identify a page. */
export const VOLATILE_QUERY_PARAMS = Object.freeze([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ref',
  'referrer'
]);

export class UrlDetector {
  /**
   * @param {object} [options]
   * @param {string[]} [options.stripParams] Query params to ignore when comparing urls.
   */
  constructor({ stripParams = VOLATILE_QUERY_PARAMS } = {}) {
    this.stripParams = stripParams;
  }

  /**
   * Parse a url without throwing.
   *
   * @param {string} url
   * @returns {URL|null} Null when the input is absent or unparseable, including the
   *                     restricted urls (`chrome://`, `about:blank`) tabs often report.
   */
  parse(url) {
    if (typeof url !== 'string' || url.length === 0) return null;
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  /**
   * Canonical form used for every comparison: lowercased host without a leading `www.`,
   * no hash, no volatile query parameters, and no trailing slash on the path.
   *
   * @param {string} url
   * @returns {string} The normalized url, or '' when it cannot be parsed.
   */
  normalize(url) {
    const parsed = this.parse(url);
    if (!parsed) return '';

    parsed.hash = '';
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    for (const param of this.stripParams) parsed.searchParams.delete(param);
    parsed.searchParams.sort();

    const path = parsed.pathname.replace(/\/+$/, '');
    const query = parsed.searchParams.toString();
    return `${parsed.protocol}//${parsed.host}${path}${query ? `?${query}` : ''}`;
  }

  /**
   * Whether two urls point at the same resource once normalized.
   *
   * @param {string} a
   * @param {string} b
   * @returns {boolean} False when either url is unparseable, so an unknown url never
   *                    matches by accident.
   */
  isSame(a, b) {
    const left = this.normalize(a);
    const right = this.normalize(b);
    return left !== '' && left === right;
  }

  /**
   * Whether a url matches a pattern.
   *
   * Three pattern forms are supported, so callers never hand-roll a regular expression:
   * - a bare hostname — `'chatgpt.com'` matches any page on that host or a subdomain;
   * - a wildcard pattern — `'https://*.jobsright.ai/jobs/*'`;
   * - a full url — compared with `isSame`.
   *
   * All three forms compare normalized urls, so `www.`, casing, a trailing slash, or a
   * tracking parameter cannot hide a tab from any of them.
   *
   * @param {string} url
   * @param {string} pattern
   * @returns {boolean}
   */
  matches(url, pattern) {
    if (typeof pattern !== 'string' || pattern.length === 0) return false;
    const parsed = this.parse(url);
    if (!parsed) return false;

    if (!pattern.includes('/') && !pattern.includes('*')) {
      return this.matchesHost(url, pattern);
    }

    if (pattern.includes('*')) {
      return patternToRegExp(this.normalizePattern(pattern)).test(this.normalize(url));
    }

    return this.isSame(url, pattern);
  }

  /**
   * Canonicalize a wildcard pattern the same way `normalize` canonicalizes a url, so both
   * sides of the comparison are in the same form. Falls back to the raw pattern when it is
   * too partial to parse.
   *
   * @param {string} pattern
   * @returns {string}
   */
  normalizePattern(pattern) {
    return this.normalize(pattern) || pattern;
  }

  /**
   * Whether a url is served by a host, treating subdomains as a match.
   * `matchesHost('https://app.jobsright.ai/x', 'jobsright.ai')` is true.
   *
   * @param {string} url
   * @param {string} host
   * @returns {boolean}
   */
  matchesHost(url, host) {
    const parsed = this.parse(url);
    if (!parsed || typeof host !== 'string' || host.length === 0) return false;
    const actual = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const expected = host.toLowerCase().replace(/^www\./, '');
    return actual === expected || actual.endsWith(`.${expected}`);
  }

  /**
   * Whether a url matches any pattern in a list. Used to recognise an application that is
   * reachable on several domains.
   *
   * @param {string} url
   * @param {string[]} patterns
   * @returns {boolean}
   */
  matchesAny(url, patterns) {
    return Array.isArray(patterns) && patterns.some((pattern) => this.matches(url, pattern));
  }

  /**
   * Origin of a url.
   * @param {string} url
   * @returns {string|null}
   */
  getOrigin(url) {
    return this.parse(url)?.origin ?? null;
  }

  /**
   * Hostname without a leading `www.`.
   * @param {string} url
   * @returns {string|null}
   */
  getHost(url) {
    const parsed = this.parse(url);
    return parsed ? parsed.hostname.toLowerCase().replace(/^www\./, '') : null;
  }

  /**
   * Whether the only difference between two urls is the fragment, meaning the document
   * did not reload. Detection uses this to avoid reporting a navigation that never
   * happened.
   *
   * @param {string} a
   * @param {string} b
   * @returns {boolean}
   */
  isHashOnlyChange(a, b) {
    const left = this.parse(a);
    const right = this.parse(b);
    if (!left || !right) return false;
    return left.hash !== right.hash && this.isSame(stripHash(left), stripHash(right));
  }

  /**
   * Whether a url belongs to a scheme the extension cannot inspect or script
   * (`chrome://`, `edge://`, `about:`, the Chrome Web Store). Detection reports these
   * tabs but must never treat them as automatable.
   *
   * @param {string} url
   * @returns {boolean}
   */
  isRestricted(url) {
    const parsed = this.parse(url);
    if (!parsed) return true;
    const restrictedSchemes = ['chrome:', 'chrome-extension:', 'edge:', 'brave:', 'opera:', 'vivaldi:', 'about:', 'devtools:', 'view-source:'];
    if (restrictedSchemes.includes(parsed.protocol)) return true;
    return this.matchesHost(url, 'chromewebstore.google.com') || this.matchesHost(url, 'chrome.google.com');
  }
}

function stripHash(parsed) {
  const copy = new URL(parsed.href);
  copy.hash = '';
  return copy.href;
}

/**
 * Translate a wildcard pattern into an anchored regular expression.
 *
 * `*` matches any run of characters; every other character is literal. A trailing `/*` also
 * matches nothing at all, so `'https://chatgpt.com/*'` still recognises the bare origin —
 * normalization strips the trailing slash, and a pattern for a section should match that
 * section's own page.
 */
function patternToRegExp(pattern) {
  const trailingWildcard = pattern.endsWith('/*');
  const body = trailingWildcard ? pattern.slice(0, -2) : pattern;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}${trailingWildcard ? '(/.*)?' : ''}$`, 'i');
}

export default UrlDetector;
