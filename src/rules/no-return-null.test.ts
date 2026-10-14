import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-return-null';

ruleTester.run('no-return-null', rule, {
  valid: [
    'function find(): string | null { return null; }',
    'function f() { return undefined; }',
    'function f() { return; }',
    'const f = (): string | null => null;',
    'function f() { return 0; }',
  ],
  invalid: [
    {
      code: 'function find() { return null; }',
      errors: [{ messageId: 'returnNull' }],
    },
    {
      code: 'const f = () => null;',
      errors: [{ messageId: 'returnNull' }],
    },
    {
      code: 'function g(x) { if (x) { return null; } return 1; }',
      errors: [{ messageId: 'returnNull' }],
    },
    {
      code: 'function find(): string | null { return null; }',
      options: [{ allowNullableReturnType: false }],
      errors: [{ messageId: 'returnNull' }],
    },
    {
      code: 'function find(): string { return null; }',
      errors: [{ messageId: 'returnNull' }],
    },
  ],
});
