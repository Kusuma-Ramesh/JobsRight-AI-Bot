/**
 * Conditions `ElementFinder.waitFor` / `DomEngine.waitForElement` can wait for.
 *
 * Present      -> the element exists in the document
 * Visible      -> it exists and is rendered (layout, paint, non-zero area)
 * Enabled      -> it exists and accepts input
 * Clickable    -> visible and not disabled; a read-only field qualifies
 * Interactable -> visible, not disabled, and not read-only
 * Absent       -> no element matches
 *
 * `Clickable` and `Interactable` differ only over `readonly`, and that difference matters:
 * a read-only field takes clicks and focus — it is how date pickers and combo boxes present
 * themselves — while refusing text.
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
  Clickable: 'clickable',
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
