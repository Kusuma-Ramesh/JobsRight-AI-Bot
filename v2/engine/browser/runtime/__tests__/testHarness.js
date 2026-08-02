/**
 * A ~60-line stand-in for a test runner, so these placeholders are executable today.
 *
 * Deliberately minimal: `describe`, `it`, `it.todo`, and a few assertions. It exists only
 * until a real runner is adopted, and should be deleted then rather than grown.
 */
const results = { passed: 0, failed: 0, todo: 0 };
let depth = 0;

export async function describe(name, body) {
  console.log(`${'  '.repeat(depth)}${name}`);
  depth += 1;
  await body();
  depth -= 1;
}

export async function it(name, body) {
  try {
    await body();
    results.passed += 1;
    console.log(`${'  '.repeat(depth)}  ok  ${name}`);
  } catch (error) {
    results.failed += 1;
    console.log(`${'  '.repeat(depth)}  FAIL ${name}\n${'  '.repeat(depth)}       ${error.message}`);
  }
}

/** Declare a case that is specified but not yet written. Reported as pending, never green. */
it.todo = (name) => {
  results.todo += 1;
  console.log(`${'  '.repeat(depth)}  todo ${name}`);
};

export const expect = (actual) => ({
  toBe(expected) {
    if (!Object.is(actual, expected)) throw new Error(`expected ${format(expected)}, got ${format(actual)}`);
  },
  toEqual(expected) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(`expected ${b}, got ${a}`);
  },
  toBeNull() {
    if (actual !== null) throw new Error(`expected null, got ${format(actual)}`);
  },
  toHaveLength(expected) {
    if (actual?.length !== expected) throw new Error(`expected length ${expected}, got ${format(actual?.length)}`);
  },
  async toReject(code) {
    try {
      await actual;
    } catch (error) {
      if (code && error.code !== code) throw new Error(`expected rejection code ${code}, got ${error.code}`);
      return;
    }
    throw new Error('expected a rejection, but it resolved');
  }
});

/** Print the summary and set a non-zero exit code when anything failed. */
export function report() {
  console.log(`\n${results.passed} passed, ${results.failed} failed, ${results.todo} todo`);
  if (results.failed > 0) process.exitCode = 1;
}

function format(value) {
  return typeof value === 'string' ? `'${value}'` : String(value);
}
