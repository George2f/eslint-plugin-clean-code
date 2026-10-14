import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-inappropriate-comments';

ruleTester.run('no-inappropriate-comments', rule, {
  valid: [
    'const x = 1;',
    '// TODO: handle errors\nconst x = retry();',
    '// retries network calls with backoff\nconst x = retry();',
    '// the retry loop backs off exponentially\nfor (let i = 0; i < 3; i++) {}',
  ],
  invalid: [
    {
      code: '// @author John Doe\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '/**\n * @author John Doe\n */\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '// created on 2020-01-01\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '// Changelog: added retry\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '// last modified by Jane\nconst x = 1;',
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
    {
      code: '// FIXME before release\nconst x = 1;',
      options: [{ patterns: ['fixme'] }],
      output: null,
      errors: [
        {
          messageId: 'inappropriateComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst x = 1;' }],
        },
      ],
    },
  ],
});
