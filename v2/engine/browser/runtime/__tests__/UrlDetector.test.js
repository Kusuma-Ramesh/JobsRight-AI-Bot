import { UrlDetector } from './../UrlDetector.js';
import { describe, expect, it, report } from './testHarness.js';

const url = new UrlDetector();

await describe('UrlDetector.normalize', async () => {
  await it('drops trailing slash, hash, www, and tracking params', () => {
    expect(url.normalize('https://www.JobsRight.ai/jobs/?utm_source=x#top')).toBe('https://jobsright.ai/jobs');
  });

  await it('returns an empty string for an unparseable url', () => {
    expect(url.normalize('not a url')).toBe('');
  });

  it.todo('sorts query parameters so order cannot cause a false mismatch');
});

await describe('UrlDetector.isSame', async () => {
  await it('treats cosmetic differences as the same resource', () => {
    expect(url.isSame('https://chatgpt.com/c/1', 'https://www.chatgpt.com/c/1/#x')).toBe(true);
  });

  await it('never matches when either url is unparseable', () => {
    expect(url.isSame('', '')).toBe(false);
  });
});

await describe('UrlDetector.matches', async () => {
  await it('matches a bare host, including subdomains', () => {
    expect(url.matches('https://app.jobsright.ai/dashboard', 'jobsright.ai')).toBe(true);
  });

  await it('matches a wildcard pattern', () => {
    expect(url.matches('https://chatgpt.com/c/abc', 'https://chatgpt.com/c/*')).toBe(true);
  });

  await it('does not match a different host', () => {
    expect(url.matches('https://jobsright.ai.evil.com/x', 'jobsright.ai')).toBe(false);
  });

  await it('normalizes both sides of a wildcard, so www and casing cannot hide a tab', () => {
    expect(url.matches('https://WWW.ChatGPT.com/c/abc?utm_source=x', 'https://chatgpt.com/c/*')).toBe(true);
  });

  await it('lets a trailing /* also match the section page itself', () => {
    expect(url.matches('https://chatgpt.com', 'https://chatgpt.com/*')).toBe(true);
  });

  await it('matches a wildcard in the host', () => {
    expect(url.matches('https://app.jobsright.ai/jobs/12', 'https://*.jobsright.ai/jobs/*')).toBe(true);
  });

  it.todo('treats a full-url pattern as an exact normalized comparison');
});

await describe('UrlDetector.isRestricted', async () => {
  await it('flags browser-internal schemes', () => {
    expect(url.isRestricted('chrome://extensions')).toBe(true);
  });

  await it('allows an ordinary page', () => {
    expect(url.isRestricted('https://jobsright.ai')).toBe(false);
  });

  it.todo('flags the Chrome Web Store, which extensions may not script');
});

await describe('UrlDetector.isHashOnlyChange', async () => {
  it.todo('returns true when only the fragment differs');
  it.todo('returns false when the path differs');
});

report();
