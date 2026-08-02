import { TabDetector } from './../TabDetector.js';
import { createFakeBrowserApi } from './fakeBrowserApi.js';
import { describe, expect, it, report } from './testHarness.js';

const browserApi = createFakeBrowserApi({
  tabs: [
    { id: 1, url: 'https://app.jobsright.ai/jobs', title: 'JobsRight — Jobs' },
    { id: 2, url: 'https://chatgpt.com/c/abc', title: 'ChatGPT', active: true },
    { id: 3, url: 'chrome://extensions', title: 'Extensions' }
  ]
});
const tabs = new TabDetector({ browserApi });

await describe('TabDetector.detectTabs', async () => {
  await it('returns every open tab as a BrowserTab', async () => {
    const found = await tabs.detectTabs();
    expect(found).toHaveLength(3);
    expect(found[0].constructor.name).toBe('BrowserTab');
  });

  await it('can exclude tabs the extension cannot inspect', async () => {
    expect(await tabs.detectTabs({ excludeRestricted: true })).toHaveLength(2);
  });

  it.todo('restricts to one window when windowId is given');
});

await describe('TabDetector.getActiveTab', async () => {
  await it('returns the active tab of the focused window', async () => {
    expect((await tabs.getActiveTab()).id).toBe(2);
  });

  it.todo('returns null when no browser window is focused');
});

await describe('TabDetector.getCurrentURL', async () => {
  await it('reports the active tab url', async () => {
    expect(await tabs.getCurrentURL()).toBe('https://chatgpt.com/c/abc');
  });
});

await describe('TabDetector.getTabByURL', async () => {
  await it('matches on host, ignoring subdomain and path', async () => {
    expect(await tabs.getTabByURL('jobsright.ai')).toHaveLength(1);
  });

  await it('returns an empty list when nothing matches', async () => {
    expect(await tabs.getTabByURL('example.com')).toHaveLength(0);
  });
});

await describe('TabDetector.getTabByTitle', async () => {
  await it('matches a case-insensitive substring', async () => {
    expect(await tabs.getTabByTitle('chatgpt')).toHaveLength(1);
  });

  it.todo('requires the whole title when exact is set');
  it.todo('accepts a RegExp');
});

await describe('TabDetector.getTab', async () => {
  await it('rejects with TAB_NOT_FOUND for an unknown id', async () => {
    await expect(tabs.getTab(999)).toReject('TAB_NOT_FOUND');
  });
});

await describe('TabDetector.findUniqueTab', async () => {
  await it('reports ambiguity instead of guessing', async () => {
    const twoChatGpt = new TabDetector({
      browserApi: createFakeBrowserApi({
        tabs: [
          { id: 1, url: 'https://chatgpt.com/c/a', title: 'ChatGPT' },
          { id: 2, url: 'https://chat.openai.com/c/b', title: 'ChatGPT' }
        ]
      })
    });
    const result = await twoChatGpt.findUniqueTab(['chatgpt.com', 'chat.openai.com']);
    expect(result.ambiguous).toBe(true);
    expect(result.tab).toBeNull();
  });
});

await describe('TabDetector.isStillValid', async () => {
  it.todo('returns false once the user closes the tab');
  it.todo('returns false once the tab navigates away from the expected url');
});

report();
