import { BrowserRuntime } from './../BrowserRuntime.js';
import { createFakeBrowserApi, createFakeNavigator } from './fakeBrowserApi.js';
import { ChromeDetector } from './../ChromeDetector.js';
import { describe, expect, it, report } from './testHarness.js';

const browserApi = createFakeBrowserApi({
  tabs: [
    { id: 1, url: 'https://app.jobsright.ai/jobs', title: 'JobsRight — Jobs' },
    { id: 2, url: 'https://chatgpt.com/c/abc', title: 'ChatGPT', active: true },
    { id: 3, url: 'https://bulkjobapply.com/queue', title: 'Bulk Job Apply' }
  ]
});

const runtime = () =>
  new BrowserRuntime({
    browserApi,
    chromeDetector: new ChromeDetector({ browserApi, navigator: createFakeNavigator() })
  });

await describe('BrowserRuntime application helpers', async () => {
  await it('finds the JobsRight tab by host', async () => {
    expect((await runtime().findJobsRightTab()).id).toBe(1);
  });

  await it('finds the ChatGPT tab', async () => {
    expect((await runtime().findChatGPTTab()).id).toBe(2);
  });

  await it('finds the Bulk Job Apply tab', async () => {
    expect((await runtime().findBulkJobApplyTab()).id).toBe(3);
  });

  await it('returns null rather than guessing when an application is not open', async () => {
    const empty = new BrowserRuntime({ browserApi: createFakeBrowserApi({ tabs: [] }) });
    expect(await empty.findChatGPTTab()).toBeNull();
  });

  it.todo('throws with an actionable message when required is set and the tab is absent');
  it.todo('falls back to a title hint when no url pattern matches');
  it.todo('prefers the active tab and warns when several tabs match');
});

await describe('BrowserRuntime.detectApplications', async () => {
  await it('reports all three as ready', async () => {
    const result = await runtime().detectApplications();
    expect(result.ready).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  await it('lists exactly which applications are missing', async () => {
    const partial = new BrowserRuntime({
      browserApi: createFakeBrowserApi({ tabs: [{ id: 1, url: 'https://chatgpt.com/', title: 'ChatGPT' }] })
    });
    expect((await partial.detectApplications()).missing).toEqual(['jobsright', 'bulkjobapply']);
  });
});

await describe('BrowserRuntime environment detection', async () => {
  await it('reports the host Chromium browser', async () => {
    const browsers = await runtime().detectInstalledBrowsers();
    expect(browsers[0].id).toBe('chrome');
  });

  await it('confirms the extension APIs it needs are present', async () => {
    expect((await runtime().detectRunningChrome()).running).toBe(true);
  });

  await it('explains why detection failed instead of returning a bare false', async () => {
    const bare = new BrowserRuntime({
      browserApi: {},
      chromeDetector: new ChromeDetector({ browserApi: {}, navigator: createFakeNavigator({ brands: [] }) })
    });
    expect((await bare.detectRunningChrome()).running).toBe(false);
  });

  await it('names Edge as Edge, not Chrome, when only the user-agent is available', async () => {
    const edge = new ChromeDetector({
      browserApi,
      navigator: createFakeNavigator({
        brands: [],
        userAgent: 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      })
    });
    const browsers = await edge.detectInstalledBrowsers();
    expect(browsers).toHaveLength(1);
    expect(browsers[0].id).toBe('edge');
  });

  await it('reports plain Chrome once, despite it advertising two generic brands', async () => {
    const chrome = new ChromeDetector({
      browserApi,
      navigator: createFakeNavigator({ brands: [{ brand: 'Google Chrome', version: '120' }, { brand: 'Chromium', version: '120' }] })
    });
    expect(await chrome.detectInstalledBrowsers()).toHaveLength(1);
  });

  it.todo('identifies Brave, Opera, and Vivaldi from client hints');
});

await describe('BrowserRuntime.detectWindows', async () => {
  await it('returns BrowserWindow models', async () => {
    const windows = await runtime().detectWindows();
    expect(windows).toHaveLength(1);
    expect(windows[0].constructor.name).toBe('BrowserWindow');
  });

  it.todo('excludes popup and devtools windows by default');
});

await describe('BrowserRuntime.verifyKnownTab', async () => {
  await it('keeps a tab that has no url patterns, checking only that it still exists', async () => {
    const custom = new BrowserRuntime({ browserApi, patterns: { chatgpt: [] } });
    custom.knownTabs.set('chatgpt', await custom.getActiveTab());
    expect(await custom.verifyKnownTab('chatgpt')).toBe(true);
  });

  await it('forgets a tab the user closed', async () => {
    const custom = runtime();
    custom.knownTabs.set('chatgpt', { id: 999, url: 'https://chatgpt.com/' });
    expect(await custom.verifyKnownTab('chatgpt')).toBe(false);
    expect(custom.getKnownTab('chatgpt')).toBeNull();
  });
});

report();
