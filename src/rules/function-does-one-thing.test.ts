import { ruleTester } from '../test-utils/rule-tester';
import rule from './function-does-one-thing';

const OVER_LIMIT_STATEMENTS = 21;

ruleTester.run('function-does-one-thing', rule, {
  valid: [
    'function validate(x) { return x; }',
    'const save = (x) => x;',
    'const handle = (x) => { return x; };',
    'function parse(value) { return value.trim(); }',
    'function format(value) {\n  const text = String(value);\n  return text;\n}',
    {
      code: 'function wrap(value) { return value; }',
      options: [{ maxStatements: 1, maxLines: 1 }],
    },
  ],
  invalid: [
    {
      code: 'function validateAndSave(x) { return x; }',
      errors: [{ messageId: 'nameSuggestsMultipleThings', data: { name: 'validateAndSave' } }],
    },
    {
      code: 'function saveOrSkip(x) { return x; }',
      errors: [{ messageId: 'nameSuggestsMultipleThings', data: { name: 'saveOrSkip' } }],
    },
    {
      code: 'const loadOrFail = (x) => x;',
      errors: [{ messageId: 'nameSuggestsMultipleThings', data: { name: 'loadOrFail' } }],
    },
    {
      code: `function big() {${' someCall();'.repeat(OVER_LIMIT_STATEMENTS)}}`,
      errors: [
        {
          messageId: 'functionTooLong',
          data: { statements: 21, maxStatements: 20, lines: 1, maxLines: 30 },
        },
      ],
    },
    {
      code: 'function compute(a, b) { const sum = a + b; return sum; }',
      options: [{ maxStatements: 1, maxLines: 30 }],
      errors: [
        {
          messageId: 'functionTooLong',
          data: { statements: 2, maxStatements: 1, lines: 1, maxLines: 30 },
        },
      ],
    },
  ],
});
