import { ActionEngine } from './../ActionEngine.js';
import { ErrorCode } from './../../utils/Errors.js';
import { createInteractiveDocument, createInteractiveElement, createInteractiveWindow, withFileSupport } from './fakePage.js';
import { describe, expect, it, report } from './../../runtime/__tests__/testHarness.js';

const hiddenBox = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };

function engine({ elements = {}, files = false } = {}) {
  const document = createInteractiveDocument({ elements });
  const window = createInteractiveWindow();
  if (files) withFileSupport(window);
  return { engine: new ActionEngine({ document, window, timeout: 40 }), document, window };
}

await describe('ActionEngine guards', async () => {
  await it('reports a target that never appears as ELEMENT_NOT_FOUND, not a timeout', async () => {
    const { engine: actions } = engine();
    const result = await actions.click('#nope');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
  });

  await it('distinguishes a hidden element from a missing one', async () => {
    const hidden = createInteractiveElement({ tagName: 'button', id: 'hidden', box: hiddenBox });
    const { engine: actions } = engine({ elements: { '#hidden': hidden } });
    const result = await actions.click('#hidden');
    expect(result.error.code).toBe(ErrorCode.ELEMENT_NOT_INTERACTABLE);
    expect(hidden.events).toHaveLength(0);
  });

  await it('refuses a disabled control rather than clicking it', async () => {
    const disabled = createInteractiveElement({ tagName: 'button', id: 'off', disabled: true });
    const { engine: actions } = engine({ elements: { '#off': disabled } });
    const result = await actions.click('#off');
    expect(result.error.code).toBe(ErrorCode.ELEMENT_NOT_INTERACTABLE);
    expect(disabled.events).toHaveLength(0);
  });

  await it('surfaces a malformed selector as INVALID_ARGUMENT in the result, never as a throw', async () => {
    const { engine: actions } = engine();
    const result = await actions.click('<<<bad');
    expect(result.success).toBe(false);
    expect(result.error.code).toBe(ErrorCode.INVALID_ARGUMENT);
  });

  await it('returns an ActivityResult with a duration for both outcomes', async () => {
    const button = createInteractiveElement({ tagName: 'button', id: 'go' });
    const { engine: actions } = engine({ elements: { '#go': button } });
    const ok = await actions.click('#go');
    const bad = await actions.click('#nope');
    expect(ok.constructor.name).toBe('ActivityResult');
    expect(bad.constructor.name).toBe('ActivityResult');
    expect(typeof ok.duration).toBe('number');
  });
});

await describe('ActionEngine pointer actions', async () => {
  await it('clicks with the full pointer sequence, not a lone click event', async () => {
    const button = createInteractiveElement({ tagName: 'button', id: 'go' });
    const { engine: actions } = engine({ elements: { '#go': button } });
    const result = await actions.click('#go');
    expect(result.success).toBe(true);
    expect(button.eventTypes()).toEqual(['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']);
  });

  await it('reports a click the page cancelled', async () => {
    const link = createInteractiveElement({ tagName: 'a', id: 'link', cancel: ['click'] });
    const { engine: actions } = engine({ elements: { '#link': link } });
    expect((await actions.click('#link')).payload.cancelled).toBe(true);
  });

  await it('double-clicks with two click sequences and a dblclick', async () => {
    const row = createInteractiveElement({ tagName: 'div', id: 'row' });
    const { engine: actions } = engine({ elements: { '#row': row } });
    await actions.doubleClick('#row');
    expect(row.eventTypes()).toEqual(['mousedown', 'mouseup', 'click', 'mousedown', 'mouseup', 'click', 'dblclick']);
    expect(row.events.filter((event) => event.type === 'click').map((event) => event.detail)).toEqual([1, 2]);
  });

  await it('right-clicks with the secondary button and a contextmenu', async () => {
    const row = createInteractiveElement({ tagName: 'div', id: 'row' });
    const { engine: actions } = engine({ elements: { '#row': row } });
    await actions.rightClick('#row');
    expect(row.eventTypes()).toEqual(['mousedown', 'mouseup', 'contextmenu']);
    expect(row.events[0].button).toBe(2);
  });

  await it('hovers a rendered but disabled element, which a tooltip needs', async () => {
    const disabled = createInteractiveElement({ tagName: 'button', id: 'off', disabled: true });
    const { engine: actions } = engine({ elements: { '#off': disabled } });
    const result = await actions.hover('#off');
    expect(result.success).toBe(true);
    expect(disabled.eventTypes()).toEqual(['pointerover', 'mouseover', 'mouseenter', 'mousemove']);
  });

  await it('clicks a read-only field, which is how date pickers and combo boxes open', async () => {
    const trigger = createInteractiveElement({ tagName: 'input', id: 'date', value: '', attributes: { readonly: '' } });
    const { engine: actions } = engine({ elements: { '#date': trigger } });
    const result = await actions.click('#date');
    expect(result.success).toBe(true);
    expect(trigger.eventTypes().includes('click')).toBe(true);
  });

  await it('focuses and sends keys to a read-only field', async () => {
    const trigger = createInteractiveElement({ tagName: 'input', id: 'date', value: '', attributes: { readonly: '' } });
    const { engine: actions } = engine({ elements: { '#date': trigger } });
    expect((await actions.focus('#date')).success).toBe(true);
    expect((await actions.pressKey('ArrowDown', { selector: '#date' })).success).toBe(true);
  });

  await it('focuses an element and confirms focus actually landed', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'name', value: '' });
    const { engine: actions } = engine({ elements: { '#name': field } });
    const result = await actions.focus('#name');
    expect(result.payload.focused).toBe(true);
    expect(field.focusCalls).toBe(1);
  });
});

await describe('ActionEngine text actions', async () => {
  await it('writes through the native setter and fires input and change', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'name', value: '' });
    const { engine: actions } = engine({ elements: { '#name': field } });
    const result = await actions.typeText('#name', 'Ada Lovelace');
    expect(result.success).toBe(true);
    expect(field.value).toBe('Ada Lovelace');
    expect(field.valueSetterCalls).toEqual(['Ada Lovelace']);
    expect(field.eventTypes()).toEqual(['input', 'change']);
  });

  await it('never puts the typed text in the result', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'name', value: '' });
    const { engine: actions } = engine({ elements: { '#name': field } });
    const result = await actions.typeText('#name', 'ada@example.test');
    expect(JSON.stringify(result).includes('ada@example.test')).toBe(false);
    expect(result.payload.length).toBe(16);
  });

  await it('appends instead of replacing', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'name', value: 'Ada ' });
    const { engine: actions } = engine({ elements: { '#name': field } });
    await actions.appendText('#name', 'Lovelace');
    expect(field.value).toBe('Ada Lovelace');
  });

  await it('dispatches per-character key events only when asked', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'q', value: '' });
    const { engine: actions } = engine({ elements: { '#q': field } });
    await actions.typeText('#q', 'ab', { perKey: true });
    expect(field.eventTypes()).toEqual(['keydown', 'keyup', 'keydown', 'keyup', 'input', 'change']);
  });

  await it('clears a field and reports only the length of what it removed', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'name', value: 'Ada Lovelace' });
    const { engine: actions } = engine({ elements: { '#name': field } });
    const result = await actions.clearInput('#name');
    expect(field.value).toBe('');
    expect(result.payload.clearedLength).toBe(12);
    expect(JSON.stringify(result).includes('Lovelace')).toBe(false);
  });

  await it('still refuses to type into a read-only field', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'date', value: '2026-01-01', attributes: { readonly: '' } });
    const { engine: actions } = engine({ elements: { '#date': field } });
    const result = await actions.typeText('#date', 'x');
    expect(result.error.code).toBe(ErrorCode.ELEMENT_NOT_INTERACTABLE);
    expect(field.value).toBe('2026-01-01');
  });

  await it('fails with ACTION_FAILED on an element that accepts no text', async () => {
    const div = createInteractiveElement({ tagName: 'div', id: 'plain' });
    const { engine: actions } = engine({ elements: { '#plain': div } });
    expect((await actions.typeText('#plain', 'x')).error.code).toBe(ErrorCode.ACTION_FAILED);
  });

  it.todo('types into a contenteditable region');
});

await describe('ActionEngine scrolling', async () => {
  await it('scrolls an element into view and reports whether it arrived', async () => {
    const card = createInteractiveElement({ tagName: 'div', id: 'card' });
    const { engine: actions } = engine({ elements: { '#card': card } });
    const result = await actions.scrollTo('#card');
    expect(result.success).toBe(true);
    expect(card.scrollIntoViewCalls[0].block).toBe('center');
    expect(result.payload.inViewport).toBe(true);
  });

  await it('scrolls the window by an offset and reports the new position', async () => {
    const { engine: actions, window } = engine();
    const result = await actions.scrollBy(0, 500);
    expect(window.scrollCalls[0]).toEqual({ left: 0, top: 500, behavior: 'auto' });
    expect(result.payload).toEqual({ action: 'Scroll', x: 0, y: 500, moved: true });
  });

  await it('reports moved: false when the page is already at its limit', async () => {
    const { engine: actions } = engine();
    expect((await actions.scrollBy(0, 0)).payload.moved).toBe(false);
  });

  await it('rejects a non-finite offset', async () => {
    const { engine: actions } = engine();
    expect((await actions.scrollBy(0, Number.NaN)).error.code).toBe(ErrorCode.ACTION_FAILED);
  });
});

await describe('ActionEngine keyboard', async () => {
  await it('sends a key to the focused element', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'q', value: '' });
    const { engine: actions, document } = engine({ elements: { '#q': field } });
    document.activeElement = field;
    const result = await actions.pressKey('Enter');
    expect(field.eventTypes()).toEqual(['keydown', 'keyup']);
    expect(result.payload.key).toBe('Enter');
  });

  await it('focuses a given selector before sending the key', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'q', value: '' });
    const { engine: actions } = engine({ elements: { '#q': field } });
    await actions.pressKey('Escape', { selector: '#q' });
    expect(field.focusCalls).toBe(1);
    expect(field.eventTypes()).toEqual(['keydown', 'keyup']);
  });

  await it('sets the modifier flags of a shortcut, in either notation', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'q', value: '' });
    const { engine: actions, document } = engine({ elements: { '#q': field } });
    document.activeElement = field;
    await actions.pressShortcut('Control+Enter');
    await actions.pressShortcut(['Shift', 'Tab']);
    expect(field.events[0].ctrlKey).toBe(true);
    expect(field.events[2].shiftKey).toBe(true);
  });

  await it('reports when a page handler consumed the keystroke', async () => {
    const field = createInteractiveElement({ tagName: 'input', id: 'q', value: '', cancel: ['keydown'] });
    const { engine: actions, document } = engine({ elements: { '#q': field } });
    document.activeElement = field;
    expect((await actions.pressKey('Enter')).payload.defaultPrevented).toBe(true);
  });

  await it('rejects an unknown modifier instead of dropping it silently', async () => {
    const { engine: actions } = engine();
    expect((await actions.pressShortcut('Hyper+Enter')).error.code).toBe(ErrorCode.ACTION_FAILED);
  });
});

await describe('ActionEngine upload', async () => {
  await it('attaches a file and fires change', async () => {
    const input = createInteractiveElement({ tagName: 'input', id: 'cv', type: 'file' });
    const { engine: actions } = engine({ elements: { '#cv': input }, files: true });
    const result = await actions.uploadFile('#cv', { content: 'bytes', fileName: 'document.pdf', mimeType: 'application/pdf' });
    expect(result.success).toBe(true);
    expect(input.files).toHaveLength(1);
    expect(input.eventTypes()).toEqual(['input', 'change']);
  });

  await it('explains that a bare path cannot be read from a page', async () => {
    const input = createInteractiveElement({ tagName: 'input', id: 'cv', type: 'file' });
    const { engine: actions } = engine({ elements: { '#cv': input }, files: true });
    const result = await actions.uploadFile('#cv', '/home/user/document.pdf');
    expect(result.error.code).toBe(ErrorCode.UPLOAD_FAILED);
    expect(result.error.message.includes('cannot be read from a page context')).toBe(true);
  });

  await it('refuses a target that is not a file input', async () => {
    const text = createInteractiveElement({ tagName: 'input', id: 'name', type: 'text', value: '' });
    const { engine: actions } = engine({ elements: { '#name': text }, files: true });
    expect((await actions.uploadFile('#name', { content: 'x', fileName: 'a.pdf' })).error.code).toBe(ErrorCode.UPLOAD_FAILED);
  });

  await it('accepts a hidden file input, since most real ones are hidden', async () => {
    const input = createInteractiveElement({ tagName: 'input', id: 'cv', type: 'file', box: hiddenBox });
    const { engine: actions } = engine({ elements: { '#cv': input }, files: true });
    expect((await actions.uploadFile('#cv', { content: 'bytes', fileName: 'cv.pdf' })).success).toBe(true);
  });

  it.todo('rejects several files on a single-file input');
});

report();
