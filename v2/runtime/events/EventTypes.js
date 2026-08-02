/**
 * The runtime's event vocabulary.
 *
 * Names are stable identifiers, namespaced by the subsystem that emits them. Subscribers
 * match on these constants, never on message text, so an event's wording can change without
 * breaking a listener.
 *
 * This catalogue is the reason the runtime can connect the workflow engine and browser
 * engine without either importing the other: both publish here, and the runtime forwards.
 */
export const EventTypes = Object.freeze({
  // Session lifecycle
  SessionCreated: 'session.created',
  SessionStarted: 'session.started',
  SessionPaused: 'session.paused',
  SessionResumed: 'session.resumed',
  SessionCompleted: 'session.completed',
  SessionFailed: 'session.failed',
  SessionStopped: 'session.stopped',

  // Workflow progress, republished from the workflow engine
  WorkflowStarted: 'workflow.started',
  WorkflowStepStarted: 'workflow.step.started',
  WorkflowStepCompleted: 'workflow.step.completed',
  WorkflowStepFailed: 'workflow.step.failed',
  WorkflowCompleted: 'workflow.completed',
  WorkflowFailed: 'workflow.failed',

  // Activity progress, republished from the activity framework
  ActivityStarted: 'activity.started',
  ActivityCompleted: 'activity.completed',
  ActivityFailed: 'activity.failed',
  ActivityRetrying: 'activity.retrying',

  // Browser observations, republished from the browser engine
  BrowserTabDetected: 'browser.tab.detected',
  BrowserTabSwitched: 'browser.tab.switched',
  BrowserPageReady: 'browser.page.ready',
  BrowserScreenshotCaptured: 'browser.screenshot.captured',
  BrowserError: 'browser.error',

  // Runtime services
  StateSaved: 'state.saved',
  StateRestored: 'state.restored',
  ConfigChanged: 'config.changed',
  LogWritten: 'log.written'
});

/** Namespace prefixes, for wildcard subscriptions such as `workflow.*`. */
export const EventNamespace = Object.freeze({
  Session: 'session',
  Workflow: 'workflow',
  Activity: 'activity',
  Browser: 'browser',
  State: 'state',
  Config: 'config',
  Log: 'log'
});

export function isEventType(value) {
  return Object.values(EventTypes).includes(value);
}

/**
 * Namespace portion of an event name, e.g. `'workflow'` for `'workflow.step.failed'`.
 * @param {string} type
 * @returns {string}
 */
export function namespaceOf(type) {
  return String(type).split('.')[0];
}

export default EventTypes;
