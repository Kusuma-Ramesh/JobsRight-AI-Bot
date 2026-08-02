/**
 * Minimal in-memory stand-in for the Chromium extension API.
 *
 * The detection layer takes `browserApi` as a constructor option precisely so it can be
 * exercised without a browser. This fake implements only the surface detection uses —
 * `tabs.query`, `tabs.get`, `windows.getAll`, `windows.get`, `windows.getLastFocused` — and
 * returns promises, matching Manifest V3.
 */
export function createFakeBrowserApi({ tabs = [], windows = [], extensionId = 'fake-extension-id' } = {}) {
  const allTabs = tabs.map((tab, index) => ({ windowId: 1, status: 'complete', index, active: false, ...tab }));
  const allWindows = windows.length
    ? windows
    : [{ id: 1, focused: true, state: 'normal', type: 'normal', tabs: allTabs }];

  return {
    runtime: {
      id: extensionId,
      getManifest: () => ({ name: 'JobsRight AI Bot', version: '0.0.0' })
    },
    tabs: {
      query: async (query = {}) =>
        allTabs.filter((tab) => {
          if (query.windowId !== undefined && tab.windowId !== query.windowId) return false;
          if (query.active !== undefined && Boolean(tab.active) !== query.active) return false;
          if (query.lastFocusedWindow) {
            const focused = allWindows.find((window) => window.focused);
            if (focused && tab.windowId !== focused.id) return false;
          }
          return true;
        }),
      get: async (tabId) => {
        const tab = allTabs.find((candidate) => candidate.id === tabId);
        if (!tab) throw new Error(`No tab with id ${tabId}`);
        return tab;
      }
    },
    windows: {
      getAll: async ({ populate = false } = {}) =>
        allWindows.map((window) => ({ ...window, tabs: populate ? allTabs.filter((tab) => tab.windowId === window.id) : undefined })),
      get: async (windowId) => {
        const window = allWindows.find((candidate) => candidate.id === windowId);
        if (!window) throw new Error(`No window with id ${windowId}`);
        return window;
      },
      getLastFocused: async () => allWindows.find((window) => window.focused) ?? allWindows[0]
    }
  };
}

/** A navigator stub reporting UA client hints, for `ChromeDetector`. */
export function createFakeNavigator({ brands = [{ brand: 'Google Chrome', version: '120' }], userAgent = '' } = {}) {
  return { userAgentData: { brands }, userAgent };
}

export default createFakeBrowserApi;
