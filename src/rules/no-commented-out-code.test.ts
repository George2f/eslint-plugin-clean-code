import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-commented-out-code';

ruleTester.run('no-commented-out-code', rule, {
  valid: [
    'const x = 1;',
    '// TODO: extract this into a helper\nconst x = 1;',
    '// increment the counter\nlet counter = 0;\ncounter += 1;',
    '/* Explains why the retry loop exists. */\nfor (let i = 0; i < 3; i++) {}',
    '// prettier-ignore\nconst matrix = [1, 2];',
    '// hello\nconst a = 1;',
    '// 1. first step\n// 2. second step',
    '// See https://example.com/docs for details',
    '// Regression: the planner passes ctx.observe - a plain (channel, text) => void\n// function - to restoreStashes. Calling observe.log(...) used to throw\n// after the stash was popped.',
  ],
  invalid: [
    {
      code: '// const answer = 42;',
      output: null,
      errors: [
        {
          messageId: 'commentedOutCode',
          suggestions: [{ messageId: 'removeCommentedOutCode', output: '' }],
        },
      ],
    },
    {
      code: '// function greet(name) {\n//   return `hi ${name}`;\n// }',
      output: null,
      errors: [
        {
          messageId: 'commentedOutCode',
          suggestions: [{ messageId: 'removeCommentedOutCode', output: '' }],
        },
      ],
    },
    {
      code: '/* console.log("debug"); */',
      output: null,
      errors: [
        {
          messageId: 'commentedOutCode',
          suggestions: [{ messageId: 'removeCommentedOutCode', output: '' }],
        },
      ],
    },
    {
      code: '// if (ready) {\n//   start();\n// }\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'commentedOutCode',
          suggestions: [{ messageId: 'removeCommentedOutCode', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '// x += 1\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'commentedOutCode',
          suggestions: [{ messageId: 'removeCommentedOutCode', output: '\nconst x = 1;' }],
        },
      ],
    },
  ],
});
