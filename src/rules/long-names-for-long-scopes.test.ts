import { ruleTester } from '../test-utils/rule-tester';
import rule from './long-names-for-long-scopes';

ruleTester.run('long-names-for-long-scopes', rule, {
  valid: [
    'const dbConnection = connect();',
    'for (let i = 0; i < 2; i++) {}',
    'const value = 1;',
    'const _db = connect();',
    'function loadOrder() {}',
    'import { it } from "vitest";',
    {
      code: 'const db = connect();',
      options: [{ minLength: 2, allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_'] }],
    },
  ],
  invalid: [
    {
      code: 'const db = connect();',
      errors: [{ messageId: 'shortNameInLongScope', data: { name: 'db' } }],
    },
    {
      code: 'function fn() {}',
      errors: [{ messageId: 'shortNameInLongScope', data: { name: 'fn' } }],
    },
    {
      code: 'import { ok } from "mod";',
      errors: [{ messageId: 'shortNameInLongScope', data: { name: 'ok' } }],
    },
    {
      code: 'class C {}',
      errors: [{ messageId: 'shortNameInLongScope', data: { name: 'C' } }],
    },
    {
      code: 'const value = 1;',
      options: [{ minLength: 6, allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_'] }],
      errors: [{ messageId: 'shortNameInLongScope', data: { name: 'value' } }],
    },
  ],
});
