import { createDocument, createElement, createWindow } from './fakeDom.js';
import { describe, expect, it, report } from './../../runtime/__tests__/testHarness.js';
import { DomEngine } from './../DomEngine.js';
import { ErrorCode } from './../../utils/Errors.js';

const child = createElement({ tagName: 'span', text: 'Software Engineer' });
const card = createElement({ tagName: 'div', id: 'job', attributes: { 'data-job-id': '42' }, text: 'Software Engineer', html: '<span>Software Engineer</span>', children: [child] });
const submit = createElement({ tagName: 'button', id: 'submit', text: 'Apply' });

const document = createDocument({
  elements: { '#job': card, '#submit': submit, '.card': [card, card] },
  xpath: { '//div[@id="job"]': card },
  elementCount: 137,
  url: 'https://example.test/jobs/42',
  title: 'Jobs'
});

const engine = new DomEngine({ document, window: createWindow() });

await describe('DomEngine finding', async () => {
  await it('finds by CSS and by XPath through one entry point', () => {
    expect(engine.findElement('#job').id).toBe('job');
    expect(engine.findElement('//div[@id="job"]').id).toBe('job');
  });

  await it('returns every match, and an empty list when there are none', () => {
    expect(engine.findElements('.card')).toHaveLength(2);
    expect(engine.findElements('#nope')).toHaveLength(0);
  });

  await it('answers elementExists without throwing on absence', () => {
    expect(engine.elementExists('#job')).toBe(true);
    expect(engine.elementExists('#nope')).toBe(false);
  });

  await it('still throws on a malformed selector, rather than reporting it as absent', () => {
    try {
      engine.elementExists('<<<bad');
      throw new Error('expected a throw');
    } catch (error) {
      expect(error.code).toBe(ErrorCode.INVALID_ARGUMENT);
    }
  });

  await it('times out waiting for an element that never appears', async () => {
    await expect(engine.waitForElement('#nope', 20)).toReject(ErrorCode.TIMEOUT);
  });

  await it('accepts an options object as the second argument of waitForElement', async () => {
    expect((await engine.waitForElement('#job', { timeout: 50, state: 'visible' })).id).toBe('job');
  });
});

await describe('DomEngine reading', async () => {
  await it('reads text, markup, and an attribute', () => {
    expect(engine.readText('#job')).toBe('Software Engineer');
    expect(engine.readHTML('#job')).toBe('<span>Software Engineer</span>');
    expect(engine.readAttribute('#job', 'data-job-id')).toBe('42');
  });

  await it('returns null for a missing element instead of throwing', () => {
    expect(engine.readText('#nope')).toBeNull();
    expect(engine.readAttribute('#nope', 'href')).toBeNull();
  });

  await it('throws ELEMENT_NOT_FOUND when the caller marks the read as required', () => {
    try {
      engine.readText('#nope', { required: true });
      throw new Error('expected a throw');
    } catch (error) {
      expect(error.code).toBe(ErrorCode.ELEMENT_NOT_FOUND);
    }
  });

  await it('reports a bounding box', () => {
    expect(engine.getBoundingBox('#job').width).toBe(100);
  });

  it.todo('distinguishes a missing attribute from a missing element');
});

await describe('DomEngine traversal and paths', async () => {
  await it('returns children and the computed paths', () => {
    expect(engine.getChildren('#job')).toHaveLength(1);
    expect(engine.getXPath('#job')).toBe('//*[@id="job"]');
    expect(engine.getCssPath('#job')).toBe('#job');
  });

  await it('returns null paths for a missing element', () => {
    expect(engine.getXPath('#nope')).toBeNull();
    expect(engine.getCssPath('#nope')).toBeNull();
  });
});

await describe('DomEngine.captureDomSnapshot', async () => {
  await it('records the page and the state of the requested elements', () => {
    const snapshot = engine.captureDomSnapshot({ elements: { job: '#job', apply: '#submit' }, label: 'before-apply' });
    expect(snapshot.url).toBe('https://example.test/jobs/42');
    expect(snapshot.elementCount).toBe(137);
    expect(snapshot.isComplete()).toBe(true);
    expect(snapshot.elements.job.id).toBe('job');
  });

  await it('names the expected elements that were missing', () => {
    const snapshot = engine.captureDomSnapshot({ elements: { job: '#job', banner: '#nope' } });
    expect(snapshot.getMissing()).toEqual(['banner']);
  });

  await it('omits markup unless it is explicitly requested', () => {
    expect(engine.captureDomSnapshot().html).toBeNull();
    expect(engine.captureDomSnapshot({ includeHtml: true }).html).toBe('<html></html>');
  });

  await it('survives a JSON round-trip', () => {
    const snapshot = engine.captureDomSnapshot({ label: 'x' });
    expect(JSON.parse(JSON.stringify(snapshot)).label).toBe('x');
  });

  it.todo('records the viewport and scroll offset');
});

await describe('DomEngine.inspectElement', async () => {
  await it('reports an explainable verdict for a missing element', () => {
    const verdict = engine.inspectElement('#nope');
    expect(verdict.exists).toBe(false);
    expect(verdict.interactable).toBe(false);
  });

  it.todo('reports found-but-hidden separately from not-found');
});

report();
