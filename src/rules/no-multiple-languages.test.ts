import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-multiple-languages';

// Fixtures are assembled from fragments so this test file itself stays free of markup literals.
const SIMPLE_HTML = ['<div>', 'x', '</div>'].join('');
const CARD_HTML = ['<div class="card">', '<span>', 'hi', '</span>', '</div>'].join('');

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
      code: `const html = '${SIMPLE_HTML}';`,
      options: [{ checkSql: false, checkHtml: false }],
    },
  ],
  invalid: [
    {
      code: 'const q = \'SELECT id, name FROM users WHERE active = 1\';',
      errors: [{ messageId: 'embeddedSql' }],
    },
    {
      code: `const html = '${CARD_HTML}';`,
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
