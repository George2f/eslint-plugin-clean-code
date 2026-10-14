import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-ambiguous-names';

ruleTester.run('no-ambiguous-names', rule, {
  valid: [
    'const value = 1;\nconst other = 2;',
    'const L = 1;',
    'function translate(input) { return input; }',
  ],
  invalid: [
    {
      code: 'const l = 1;',
      errors: [{ messageId: 'ambiguousName', data: { name: 'l' } }],
    },
    {
      code: 'const count = 1;\nconst Count = 2;',
      errors: [
        { messageId: 'confusableNames', data: { name: 'count', other: 'Count' } },
        { messageId: 'confusableNames', data: { name: 'Count', other: 'count' } },
      ],
    },
    {
      code: 'function f(O) {}',
      errors: [{ messageId: 'ambiguousName', data: { name: 'O' } }],
    },
    {
      code: 'try {} catch (I) {}',
      errors: [{ messageId: 'ambiguousName', data: { name: 'I' } }],
    },
  ],
});
