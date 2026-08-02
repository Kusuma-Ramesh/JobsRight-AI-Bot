import { createDocument, createElement } from './fakeDom.js';
import { describe, expect, it, report } from './../../runtime/__tests__/testHarness.js';
import { ErrorCode } from './../../utils/Errors.js';
import { Selector, SelectorType } from './../../models/Selector.js';
import { SelectorEngine } from './../SelectorEngine.js';

const submit = createElement({ tagName: 'button', id: 'submit', text: 'Apply' });
const row = createElement({ tagName: 'li', text: 'Job' });
const document = createDocument({
  elements: { '#submit': submit, '.row': [row, row], 'a.fallback': submit },
  xpath: { '//button[@id="submit"]': submit }
});
const engine = new SelectorEngine({ document });

await describe('Selector.from', async () => {
  await it('infers CSS by default and XPath from a leading slash', () => {
    expect(Selector.from('#submit').type).toBe(SelectorType.Css);
    expect(Selector.from('//button').type).toBe(SelectorType.XPath);
  });

  await it('honours an explicit prefix over inference', () => {
    const selector = Selector.from('css=//weird-tag');
    expect(selector.type).toBe(SelectorType.Css);
    expect(selector.value).toBe('//weird-tag');
  });

  await it('rejects an empty expression', () => {
    expect(Selector.from('').isValid()).toBe(false);
  });

  it.todo('round-trips through toJSON/fromJSON with fallbacks intact');
});

await describe('SelectorEngine.query', async () => {
  await it('resolves a CSS selector', () => {
    expect(engine.queryFirst('#submit')).toBe(submit);
  });

  await it('resolves an XPath expression', () => {
    expect(engine.queryFirst('//button[@id="submit"]')).toBe(submit);
  });

  await it('returns every match', () => {
    expect(engine.query('.row')).toHaveLength(2);
  });

  await it('falls back to the next expression when the primary finds nothing', () => {
    expect(engine.queryFirst(new Selector({ value: '#missing', fallbacks: ['a.fallback'] }))).toBe(submit);
  });

  await it('reports a malformed expression as INVALID_ARGUMENT, not as an absence', () => {
    try {
      engine.queryFirst('<<<bad');
      throw new Error('expected a throw');
    } catch (error) {
      expect(error.code).toBe(ErrorCode.INVALID_ARGUMENT);
    }
  });

  await it('fails clearly when there is no document at all', () => {
    try {
      new SelectorEngine({ document: undefined }).queryFirst('#submit');
      throw new Error('expected a throw');
    } catch (error) {
      expect(error.code).toBe(ErrorCode.ENGINE_NOT_INITIALIZED);
    }
  });

  it.todo('scopes a query to a root node');
  it.todo('matches real CSS and XPath against a live DOM (needs jsdom or Chrome)');
});

await describe('SelectorEngine paths', async () => {
  await it('prefers an id when building an XPath', () => {
    expect(engine.getXPath(submit)).toBe('//*[@id="submit"]');
  });

  await it('shortens a CSS path at the nearest id', () => {
    const child = createElement({ tagName: 'span' });
    createElement({ tagName: 'div', id: 'panel', children: [child] });
    expect(engine.getCssPath(child)).toBe('#panel > span');
  });

  await it('indexes siblings that share a tag', () => {
    const first = createElement({ tagName: 'li' });
    const second = createElement({ tagName: 'li' });
    createElement({ tagName: 'ul', id: 'list', children: [first, second] });
    expect(engine.getCssPath(second)).toBe('#list > li:nth-of-type(2)');
  });

  await it('returns null for a non-element', () => {
    expect(engine.getXPath(null)).toBeNull();
  });

  it.todo('produces an absolute XPath when no ancestor has an id');
});

report();
