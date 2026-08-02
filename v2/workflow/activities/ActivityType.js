/**
 * The generic browser operations an Activity can describe.
 *
 * These are deliberately application-agnostic: an ActivityType says *what kind of
 * interaction* is performed, never which site it is performed on. Site-specific
 * knowledge belongs in controllers and selectors.
 */
export const ActivityType = Object.freeze({
  Click: 'Click',
  Type: 'Type',
  ReadText: 'ReadText',
  ReadAttribute: 'ReadAttribute',
  WaitElement: 'WaitElement',
  WaitPage: 'WaitPage',
  UploadFile: 'UploadFile',
  DownloadFile: 'DownloadFile',
  Scroll: 'Scroll',
  SwitchTab: 'SwitchTab',
  OpenTab: 'OpenTab',
  CloseTab: 'CloseTab',
  CaptureScreenshot: 'CaptureScreenshot'
});

export function isActivityType(value) {
  return Object.prototype.hasOwnProperty.call(ActivityType, value);
}

export default ActivityType;
