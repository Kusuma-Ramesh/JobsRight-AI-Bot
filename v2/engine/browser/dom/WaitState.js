/**
 * Conditions `ElementFinder.waitFor` / `DomEngine.waitForElement` can wait for.
 *
 * Present      -> the element exists in the document
 * Visible      -> it exists and is rendered (layout, paint, non-zero area)
 * Enabled      -> it exists and accepts input
 * Interactable -> visible and enabled; the precondition a later action will require
 * Absent       -> no element matches
 *
 * Shaped like `ActivityStatus` and `WorkflowState`: a frozen enum, a frozen list of its
 * values, and a guard. The values are lowercase rather than PascalCase because, unlike
 * those two, these are not persisted lifecycle states — they are literals a caller passes
 * in (`{ state: 'visible' }`) and are already part of the published DOM engine API.
 */
export const WaitState = Object.freeze({
  Present: 'present',
  Visible: 'visible',
  Enabled: 'enabled',
  Interactable: 'interactable',
  Absent: 'absent'
});

/** Every accepted wait condition. */
export const WAIT_STATES = Object.freeze(Object.values(WaitState));

/**
 * Whether a value is a supported wait condition.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isWaitState(value) {
  return WAIT_STATES.includes(value);
}

export default WaitState;
