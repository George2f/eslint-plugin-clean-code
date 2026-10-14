import { ruleTester } from '../test-utils/rule-tester';
import rule from './declaration-proximity';

ruleTester.run('declaration-proximity', rule, {
  valid: [
    'function f() { const value = compute(); doSomething(); return value; }',
    'const CONFIG = 1;\n' + 'const OTHER = 2;\n'.repeat(20) + 'function f() { return CONFIG; }',
    'for (let i = 0; i < 10; i++) { console.log(i); }',
    'function f() { const { value } = compute(); doSomething(); return value; }',
    {
      code: `function f() { const value = compute(); ${'doSomething();\n'.repeat(18)} return value; }`,
      options: [{ maxDistance: 20 }],
    },
  ],
  invalid: [
    {
      code: `function f() { const value = compute(); ${'doSomething();\n'.repeat(18)} return value; }`,
      errors: [{ messageId: 'farFromUsage', data: { name: 'value', distance: 18 } }],
    },
    {
      code: `function f() { const value = compute(); ${'doSomething();\n'.repeat(2)} return value; }`,
      options: [{ maxDistance: 1 }],
      errors: [{ messageId: 'farFromUsage', data: { name: 'value', distance: 2 } }],
    },
    {
      code: `function f(flag) { const total = compute(); ${'doSomething();\n'.repeat(16)} if (flag) { return total; } }`,
      errors: [{ messageId: 'farFromUsage', data: { name: 'total', distance: 16 } }],
    },
    {
      code: `function f() { const a = computeA(); const b = computeB(); ${'doSomething();\n'.repeat(18)} return a + b; }`,
      errors: [
        { messageId: 'farFromUsage', data: { name: 'a', distance: 18 } },
        { messageId: 'farFromUsage', data: { name: 'b', distance: 18 } },
      ],
    },
  ],
});
