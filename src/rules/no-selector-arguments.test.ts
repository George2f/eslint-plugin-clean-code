import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-selector-arguments';

ruleTester.run('no-selector-arguments', rule, {
  valid: [
    'function pick(mode, data) { return data[mode]; }',
    'function pick(mode) { return mode + 1; }',
    'function pick(mode) { if (mode === "a") return 1; return doWork(mode); }',
    'function pick(mode) { return mode === "a"; }',
    {
      code: 'function pick(mode) { if (mode === "a") return 1; if (mode === "b") return 2; return 3; }',
      options: [{ minComparisons: 3 }],
    },
  ],
  invalid: [
    {
      code: 'function pick(mode) { if (mode === "a") return 1; if (mode === "b") return 2; return 3; }',
      errors: [{ messageId: 'selectorArgument', data: { name: 'mode' } }],
    },
    {
      code: 'function run(op) { switch (op) { case "x": return 1; default: return 2; } }',
      errors: [{ messageId: 'selectorArgument', data: { name: 'op' } }],
    },
    {
      code: 'const pick = (mode) => (mode === "a" ? 1 : mode === "b" ? 2 : 3);',
      errors: [{ messageId: 'selectorArgument', data: { name: 'mode' } }],
    },
    {
      code: 'function isAdmin(role) { return role === "admin"; }',
      options: [{ minComparisons: 1 }],
      errors: [{ messageId: 'selectorArgument', data: { name: 'role' } }],
    },
  ],
});
