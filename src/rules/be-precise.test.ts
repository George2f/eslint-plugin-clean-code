import { ruleTester } from '../test-utils/rule-tester';
import rule from './be-precise';

ruleTester.run('be-precise', rule, {
  valid: [
    'if (x === 1) {}',
    'const n = parseInt("10", 10);',
    'const n = Number.parseInt("10");',
    'if (x !== 2) {}',
    'const total = x + 0.1;',
  ],
  invalid: [
    {
      code: 'if (x === 0.1) {}',
      errors: [{ messageId: 'floatEquality', data: { value: 0.1 } }],
    },
    {
      code: 'const n = parseInt("10");',
      errors: [{ messageId: 'parseIntWithoutRadix' }],
    },
    {
      code: 'if (total !== 0.5) {}',
      errors: [{ messageId: 'floatEquality', data: { value: 0.5 } }],
    },
    {
      code: 'if (0.3 == x) {}',
      errors: [{ messageId: 'floatEquality', data: { value: 0.3 } }],
    },
  ],
});
