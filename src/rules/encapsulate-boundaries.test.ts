import { ruleTester } from '../test-utils/rule-tester';
import rule from './encapsulate-boundaries';

ruleTester.run('encapsulate-boundaries', rule, {
  valid: [
    'const n = arr.length;',
    'const next = index + 1;',
    'const half = size / 2;',
    'const last = arr.length - offset;',
    'const total = count * 2;',
  ],
  invalid: [
    {
      code: 'const last = arr.length - 1;',
      errors: [{ messageId: 'boundaryCondition', data: { property: 'length' } }],
    },
    {
      code: 'if (i <= list.length - 1) {}',
      errors: [{ messageId: 'boundaryCondition', data: { property: 'length' } }],
    },
    {
      code: 'const cap = queue.size + 1;',
      errors: [{ messageId: 'boundaryCondition', data: { property: 'size' } }],
    },
    {
      code: 'const next = 1 + arr.count;',
      errors: [{ messageId: 'boundaryCondition', data: { property: 'count' } }],
    },
  ],
});
