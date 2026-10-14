import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-flag-arguments';

ruleTester.run('no-flag-arguments', rule, {
  valid: [
    'function f(a, b) {}',
    'function f(flag) {}',
    'function f(flag: string) {}',
    'function f(options = {}) {}',
    'function f(count = 0) {}',
    'const f = (a, b) => a + b;',
  ],
  invalid: [
    {
      code: 'function f(flag: boolean) {}',
      errors: [{ messageId: 'flagArgument', data: { name: 'flag' } }],
    },
    {
      code: 'function f(flag = true) {}',
      errors: [{ messageId: 'flagArgument', data: { name: 'flag' } }],
    },
    {
      code: 'const f = (debug = false) => {};',
      errors: [{ messageId: 'flagArgument', data: { name: 'debug' } }],
    },
    {
      code: 'class C { m(enabled: boolean) {} }',
      errors: [{ messageId: 'flagArgument', data: { name: 'enabled' } }],
    },
    {
      code: 'class C { constructor(verbose = false) {} }',
      errors: [{ messageId: 'flagArgument', data: { name: 'verbose' } }],
    },
  ],
});
