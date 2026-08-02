import { createDocument, createElement, createWindow } from './fakeDom.js';
import { describe, expect, it, report } from './../../runtime/__tests__/testHarness.js';
import { ElementFinder } from './../ElementFinder.js';
import { ElementValidator } from './../ElementValidator.js';
import { ErrorCode } from './../../utils/Errors.js';

const hidden = createElement({ tagName: 'div', id: 'hidden', style: { display: 'none' } });
const zeroArea = createElement({ tagName: 'div', box: { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 } });
const offscreen = createElement({ tagName: 'div', box: { x: 0, y: 2000, width: 100, height: 20, top: 2000, left: 0, bottom: 2020, right: 100 } });
const disabled = createElement({ tagName: 'button', disabled: true });
const child = createElement({ tagName: 'span', text: 'child' });
const parent = createElement({ tagName: 'div', id: 'parent', children: [child] });
const submit = createElement({
  tagName: 'button',
  id: 'submit',
  classList: ['primary'],
  attributes: { 'data-testid': 'submit', type: 'submit' },
  text: '  Apply now  ',
  html: '<span>Apply now</span>'
});

const window = createWindow();

function finder(elements) {
  return new ElementFinder({
    document: createDocument({ elements }),
    window,
    pollInterval: 5,
    timeout: 60
  });
}

const base = finder({ '#submit': submit, '#hidden': hidden, '#disabled': disabled, '#parent': parent, '.row': [submit, submit] });

await describe('ElementFinder.find', async () => {
  await it('returns a serializable DomElement, not a live node', () => {
    const element = base.find('#submit');
    expect(element.constructor.name).toBe('DomElement');
    expect(JSON.stringify(element).includes('parentNode')).toBe(false);
  });

  await it('reads tag, id, classes, attributes, and trimmed text', () => {
    const element = base.find('#submit');
    expect(element.describe()).toBe('button#submit.primary');
    expect(element.getAttribute('data-testid')).toBe('submit');
    expect(element.text).toBe('Apply now');
  });

  await it('omits markup unless it is explicitly requested', () => {
    expect(base.find('#submit').html).toBeNull();
    expect(base.find('#submit', { html: true }).html).toBe('<span>Apply now</span>');
  });

  await it('returns null for a missing element, and throws when required', () => {
    expect(base.find('#nope')).toBeNull();
    try {
      base.find('#nope', { required: true });
      throw new Error('expected a throw');
    } catch (error) {
      expect(error.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
    }
  });

  await it('keeps the live node reachable but unserializable', () => {
    expect(base.find('#submit').ref).toBe(submit);
  });

  it.todo('computes xpath and cssPath only when paths is set');
});

await describe('ElementFinder.findAll / exists', async () => {
  await it('describes every match', () => {
    expect(base.findAll('.row')).toHaveLength(2);
  });

  await it('reports absence as an empty list, not null', () => {
    expect(base.findAll('#nope')).toHaveLength(0);
  });

  await it('answers existence without describing the element', () => {
    expect(base.exists('#submit')).toBe(true);
    expect(base.exists('#nope')).toBe(false);
  });
});

await describe('ElementFinder.waitFor', async () => {
  await it('resolves once the element appears', async () => {
    const elements = {};
    const waiter = new ElementFinder({ document: createDocument({ elements }), window, pollInterval: 5, timeout: 500 });
    setTimeout(() => {
      elements['#late'] = submit;
    }, 20);
    expect((await waiter.waitFor('#late')).id).toBe('submit');
  });

  await it('times out with TIMEOUT rather than hanging', async () => {
    await expect(base.waitFor('#nope', { timeout: 20 })).toReject(ErrorCode.TIMEOUT);
  });

  await it('does not accept a present-but-hidden element for state visible', async () => {
    await expect(base.waitFor('#hidden', { state: 'visible', timeout: 20 })).toReject(ErrorCode.TIMEOUT);
  });

  await it('resolves for state absent when nothing matches', async () => {
    expect(await base.waitFor('#nope', { state: 'absent', timeout: 20 })).toBeNull();
  });

  it.todo('honours a timeout carried on the selector itself');
  it.todo('waits for state interactable on an initially disabled control');
});

await describe('ElementFinder traversal', async () => {
  await it('returns the parent and the element children', () => {
    expect(base.parentOf('#parent')).toBeNull();
    expect(base.childrenOf('#parent')).toHaveLength(1);
    expect(base.childrenOf('#parent')[0].text).toBe('child');
  });
});

await describe('ElementValidator', async () => {
  const validator = new ElementValidator({ window });

  await it('treats display none and zero area as invisible', () => {
    expect(validator.isVisible(hidden)).toBe(false);
    expect(validator.isVisible(zeroArea)).toBe(false);
  });

  await it('does not treat scrolled-out-of-view as invisible', () => {
    expect(validator.isVisible(offscreen)).toBe(true);
    expect(validator.isInViewport(offscreen)).toBe(false);
  });

  await it('explains why an element is unusable instead of returning a bare false', () => {
    expect(validator.inspect(hidden).reason.includes('not rendered')).toBe(true);
    expect(validator.inspect(disabled).reason.includes('disabled')).toBe(true);
    expect(validator.inspect(null).reason.includes('not present')).toBe(true);
  });

  await it('reports a visible enabled element as interactable', () => {
    expect(validator.inspect(submit).interactable).toBe(true);
  });

  it.todo('treats opacity 0 and visibility hidden as invisible');
  it.todo('treats aria-disabled and readonly as disabled');
});

report();
