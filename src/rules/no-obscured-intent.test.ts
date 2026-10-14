import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-obscured-intent';

ruleTester.run('no-obscured-intent', rule, {
  valid: [
    'const x = a ? b : c;',
    'for (let i = 0, j = 1; i < 2; i++, j--) {}',
    'let x;\nx = f();\nif (x) {}',
    'for (a(), b(); ready; ) {}',
  ],
  invalid: [
    {
      code: 'const x = a ? b ? c : d : e;',
      errors: [{ messageId: 'nestedTernary' }],
    },
    {
      code: 'const x = (a(), b());',
      errors: [{ messageId: 'sequenceExpression' }],
    },
    {
      code: 'let x;\nif ((x = f())) {}',
      errors: [{ messageId: 'assignmentInCondition' }],
    },
    {
      code: 'let x;\nwhile ((x = next())) { break; }',
      errors: [{ messageId: 'assignmentInCondition' }],
    },
    {
      code: 'let x;\nif (a && (x = b)) {}',
      errors: [{ messageId: 'assignmentInCondition' }],
    },
  ],
});
