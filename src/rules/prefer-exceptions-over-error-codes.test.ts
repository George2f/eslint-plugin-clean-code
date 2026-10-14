import { ruleTester } from '../test-utils/rule-tester';
import rule from './prefer-exceptions-over-error-codes';

ruleTester.run('prefer-exceptions-over-error-codes', rule, {
  valid: [
    'function f() { return 0; }',
    'function f() { return value; }',
    'function f(a) { return -1 * a; }',
    'function f() { return -1.5; }',
    'function f() { return -(a + b); }',
  ],
  invalid: [
    {
      code: 'function indexOf(arr, x) { for (const v of arr) { if (v === x) return 1; } return -1; }',
      errors: [{ messageId: 'errorCodeReturn' }],
    },
    {
      code: 'function check(x) { if (!x) { return -1; } return 0; }',
      errors: [{ messageId: 'errorCodeReturn' }],
    },
    {
      code: 'function f(a) { if (a) { return -1; } return -1; }',
      errors: [{ messageId: 'errorCodeReturn' }, { messageId: 'errorCodeReturn' }],
    },
  ],
});
