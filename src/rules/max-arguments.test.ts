import { ruleTester } from '../test-utils/rule-tester';
import rule from './max-arguments';

ruleTester.run('max-arguments', rule, {
  valid: [
    'function f(a, b, c) {}',
    'const f = (a, b, c) => a + b + c;',
    'function f(...args) {}',
    'const o = { m(a, b) {} };',
    { code: 'function f(a, b, c, d) {}', options: [{ max: 4 }] },
  ],
  invalid: [
    {
      code: 'function f(a, b, c, d) {}',
      errors: [{ messageId: 'tooManyArguments', data: { count: 4, max: 3 } }],
    },
    {
      code: 'const f = (a, b, c, d) => a + b + c + d;',
      errors: [{ messageId: 'tooManyArguments', data: { count: 4, max: 3 } }],
    },
    {
      code: 'function f(a, b, c) {}',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyArguments', data: { count: 3, max: 2 } }],
    },
    {
      code: 'class C { m(a, b, c, d) {} }',
      errors: [{ messageId: 'tooManyArguments', data: { count: 4, max: 3 } }],
    },
    {
      code: 'class C { constructor(a, b, c, d) {} }',
      errors: [{ messageId: 'tooManyArguments', data: { count: 4, max: 3 } }],
    },
  ],
});
