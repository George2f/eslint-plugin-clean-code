import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-magic-numbers';

const CUSTOM_IGNORED_VALUE = 99;

ruleTester.run('no-magic-numbers', rule, {
  valid: [
    'const MAX_RETRIES = 5;',
    'const HOURS_PER_DAY = 24;',
    'const x = arr[1];',
    'for (let i = 0; i < 2; i++) {}',
    'function f(x = 42) {}',
    'const v = value * -1;',
    'const CONFIG = { port: 3000 };',
    'config.timeout = 60000;',
    'parseInt(input, 10);',
    'enum E { A = 5 }',
    {
      code: 'const el = <Icon size={12} />;',
      filename: 'component.tsx',
    },
    {
      code: 'const v = arr[7];',
      options: [{ ignore: [0, 1, 2, -1], ignoreDefaultValues: true, ignoreArrayIndexes: true, ignoreEnums: true }],
    },
    {
      code: 'function f() { return 99; }',
      options: [{ ignore: [CUSTOM_IGNORED_VALUE], ignoreDefaultValues: true, ignoreArrayIndexes: false, ignoreEnums: true }],
    },
  ],
  invalid: [
    {
      code: 'setTimeout(fn, 3000);',
      errors: [{ messageId: 'magicNumber', data: { value: 3000 } }],
    },
    {
      code: 'const x = base * 86400;',
      errors: [{ messageId: 'magicNumber', data: { value: 86400 } }],
    },
    {
      code: 'const LIMITS = [5, 10];',
      errors: [
        { messageId: 'magicNumber', data: { value: 5 } },
        { messageId: 'magicNumber', data: { value: 10 } },
      ],
    },
    {
      code: 'if (count > 10) {}',
      errors: [{ messageId: 'magicNumber', data: { value: 10 } }],
    },
    {
      code: 'const v = arr[7];',
      errors: [{ messageId: 'magicNumber', data: { value: 7 } }],
    },
    {
      code: 'function f(x = 42) {}',
      options: [{ ignore: [0, 1, 2, -1], ignoreDefaultValues: false, ignoreArrayIndexes: false, ignoreEnums: true }],
      errors: [{ messageId: 'magicNumber', data: { value: 42 } }],
    },
    {
      code: 'const timeout = fn || 500;',
      errors: [{ messageId: 'magicNumber', data: { value: 500 } }],
    },
  ],
});
