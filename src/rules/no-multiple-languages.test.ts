import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-multiple-languages';

ruleTester.run('no-multiple-languages', rule, {
  valid: [
    'const s = "select the option from the menu";',
    'const s = "just some text";',
    'const s = "a < b and c > d";',
    'const s = "delete from the list";',
    {
      code: 'const q = \'SELECT id FROM users\';',
      options: [{ checkSql: false, checkHtml: true }],
    },
    {
      code: 'const html = \'<div>x</div>\';',
      options: [{ checkSql: false, checkHtml: false }],
    },
  ],
  invalid: [
    {
      code: 'const q = \'SELECT id, name FROM users WHERE active = 1\';',
      errors: [{ messageId: 'embeddedSql' }],
    },
    {
      code: 'const html = \'<div class="card"><span>hi</span></div>\';',
      errors: [{ messageId: 'embeddedHtml' }],
    },
    {
      code: 'const q = `DELETE FROM sessions WHERE expired = true`;',
      errors: [{ messageId: 'embeddedSql' }],
    },
    {
      code: 'const q = \'SELECT a, b FROM t\';',
      options: [{ checkSql: true, checkHtml: false }],
      errors: [{ messageId: 'embeddedSql' }],
    },
  ],
});
