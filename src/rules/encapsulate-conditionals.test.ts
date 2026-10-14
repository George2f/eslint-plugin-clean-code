import { ruleTester } from '../test-utils/rule-tester';
import rule from './encapsulate-conditionals';

ruleTester.run('encapsulate-conditionals', rule, {
  valid: [
    'if (a && b) {}',
    'if (a && b || c) {}',
    'const x = a || b ? 1 : 2;',
    'while (x || y) {}',
    { code: 'if (a && b || c) {}', options: [{ maxLogicalOperators: 2 }] },
    { code: 'if (a) {}', options: [{ maxLogicalOperators: 0 }] },
  ],
  invalid: [
    {
      code: 'if (a && b || c && d) {}',
      errors: [{ messageId: 'complexCondition', data: { count: 3, max: 2 } }],
    },
    {
      code: 'while (x && y || z && w) {}',
      errors: [{ messageId: 'complexCondition', data: { count: 3, max: 2 } }],
    },
    {
      code: 'if (a && b) {}',
      options: [{ maxLogicalOperators: 0 }],
      errors: [{ messageId: 'complexCondition', data: { count: 1, max: 0 } }],
    },
    {
      code: 'do {} while (a && b && c && d);',
      errors: [{ messageId: 'complexCondition', data: { count: 3, max: 2 } }],
    },
    {
      code: 'const x = a && b || c && d ? 1 : 2;',
      errors: [{ messageId: 'complexCondition', data: { count: 3, max: 2 } }],
    },
  ],
});
