import { ruleTester } from '../test-utils/rule-tester';
import rule from './descriptive-names';

ruleTester.run('descriptive-names', rule, {
  valid: [
    'const count = 1;',
    'for (let i = 0; i < 2; i++) {}',
    'users.map((x) => x.id);',
    'const _private = 1;',
    'function transform(value) { return value; }',
    'try { run(); } catch (error) {}',
    { code: 'const d = 1;', options: [{ allow: ['d'], forbidden: ['data'] }] },
  ],
  invalid: [
    {
      code: 'const d = 1;',
      errors: [{ messageId: 'singleLetterName', data: { name: 'd' } }],
    },
    {
      code: 'let data = fetch();',
      errors: [{ messageId: 'vagueName', data: { name: 'data' } }],
    },
    {
      code: 'function transform(temp) { return temp; }',
      errors: [{ messageId: 'vagueName', data: { name: 'temp' } }],
    },
    {
      code: 'function f(x) {}',
      errors: [{ messageId: 'singleLetterName', data: { name: 'f' } }],
    },
    {
      code: 'const tmp = 1;',
      errors: [{ messageId: 'vagueName', data: { name: 'tmp' } }],
    },
  ],
});
