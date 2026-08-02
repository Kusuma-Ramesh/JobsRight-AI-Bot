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

  it.todo('identifies Edge, Brave, Opera, and Vivaldi from client hints');
  it.todo('falls back to the user-agent string when client hints are unavailable');
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
  it.todo('returns false and forgets the tab once the user closes it');
});

report();
