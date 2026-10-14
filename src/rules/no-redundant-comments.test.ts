import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-redundant-comments';

ruleTester.run('no-redundant-comments', rule, {
  valid: [
    'const x = 1;',
    '// convert cents to dollars\nconst cents = getCents();',
    '// increment the counter\ncounter++;',
    '// fetch user profile from the api\nfetchUserProfile();',
    '// prettier-ignore\nconst matrix = [1, 2];',
    '// 2020 report\nconst report = buildReport();',
  ],
  invalid: [
    {
      code: '// fetch user profile\nfetchUserProfile();',
      output: null,
      errors: [
        {
          messageId: 'redundantComment',
          suggestions: [{ messageId: 'removeComment', output: '\nfetchUserProfile();' }],
        },
      ],
    },
    {
      code: '// count items\nconst count = items.length;',
      output: null,
      errors: [
        {
          messageId: 'redundantComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst count = items.length;' }],
        },
      ],
    },
    {
      code: 'fetchUserProfile(); // fetch user profile',
      output: null,
      errors: [
        {
          messageId: 'redundantComment',
          suggestions: [
            { messageId: 'removeComment', output: 'fetchUserProfile(); ' },
          ],
        },
      ],
    },
    {
      code: '/* count items */\nconst count = items.length;',
      output: null,
      errors: [
        {
          messageId: 'redundantComment',
          suggestions: [{ messageId: 'removeComment', output: '\nconst count = items.length;' }],
        },
      ],
    },
    {
      code: '// update total price\nupdateTotalPrice();',
      output: null,
      errors: [
        {
          messageId: 'redundantComment',
          suggestions: [{ messageId: 'removeComment', output: '\nupdateTotalPrice();' }],
        },
      ],
    },
  ],
});
