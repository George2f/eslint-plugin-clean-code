import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-dead-code';

ruleTester.run('no-dead-code', rule, {
  valid: [
    'export const used = 1;',
    'const _ignored = 1;',
    'try { doWork(); } catch (error) {}',
    'function f(a) { return a; }',
    'const used = 1;\nused;',
    'import { used } from "mod";\nused();',
    'function f() { doWork(); return 1; }',
    'function f() { if (ready) { return 1; } return 2; }',
    'switch (mode) { case 1: break; }',
    {
      code: 'const keep = 1;',
      options: [{ ignoreNames: ['keep'], ignoreRestSiblings: true }],
    },
    'const { skipped, ...rest } = source;\nrest;',
    'const [first, ...others] = list;\nothers;',
  ],
  invalid: [
    {
      code: 'const unused = 1;',
      output: null,
      errors: [
        {
          messageId: 'unusedVariable',
          data: { name: 'unused' },
          suggestions: [
            { messageId: 'removeUnusedVariable', data: { name: 'unused' }, output: '' },
          ],
        },
      ],
    },
    {
      code: 'function f() { const unused = 1; }',
      output: null,
      errors: [
        {
          messageId: 'unusedVariable',
          data: { name: 'unused' },
          suggestions: [
            {
              messageId: 'removeUnusedVariable',
              data: { name: 'unused' },
              output: 'function f() {  }',
            },
          ],
        },
      ],
    },
    {
      code: 'const unused = 1, kept = 2;\nkept;',
      output: null,
      errors: [
        {
          messageId: 'unusedVariable',
          data: { name: 'unused' },
          suggestions: [
            {
              messageId: 'removeUnusedVariable',
              data: { name: 'unused' },
              output: 'const kept = 2;\nkept;',
            },
          ],
        },
      ],
    },
    {
      code: 'const pending = fetchData();',
      output: null,
      errors: [{ messageId: 'unusedVariable', data: { name: 'pending' } }],
    },
    {
      code: 'for (const item of list) { log(other); }',
      output: null,
      errors: [{ messageId: 'unusedVariable', data: { name: 'item' } }],
    },
    {
      code: 'import { unused } from "mod";',
      output: 'import "mod";',
      errors: [{ messageId: 'unusedImport', data: { name: 'unused' } }],
    },
    {
      code: 'import { unused, used } from "mod";\nused();',
      output: 'import { used } from "mod";\nused();',
      errors: [{ messageId: 'unusedImport', data: { name: 'unused' } }],
    },
    {
      code: 'import defaultExport from "mod";',
      output: 'import "mod";',
      errors: [{ messageId: 'unusedImport', data: { name: 'defaultExport' } }],
    },
    {
      code: 'import first, { second } from "mod";\nsecond();',
      output: 'import { second } from "mod";\nsecond();',
      errors: [{ messageId: 'unusedImport', data: { name: 'first' } }],
    },
    {
      code: 'import first, * as all from "mod";\nall.second();',
      output: 'import * as all from "mod";\nall.second();',
      errors: [{ messageId: 'unusedImport', data: { name: 'first' } }],
    },
    {
      code: 'function f() { return 1; doWork(); }',
      output: null,
      errors: [
        {
          messageId: 'unreachableCode',
          suggestions: [
            { messageId: 'removeUnreachableCode', output: 'function f() { return 1;  }' },
          ],
        },
      ],
    },
    {
      code: 'function f() { throw new Error("boom"); cleanup(); }',
      output: null,
      errors: [
        {
          messageId: 'unreachableCode',
          suggestions: [
            {
              messageId: 'removeUnreachableCode',
              output: 'function f() { throw new Error("boom");  }',
            },
          ],
        },
      ],
    },
    {
      code: 'const { email } = source;',
      output: null,
      errors: [{ messageId: 'unusedVariable', data: { name: 'email' } }],
    },
    {
      code: 'const { skipped, ...rest } = source;\nrest;',
      options: [{ ignoreNames: [], ignoreRestSiblings: false }],
      output: null,
      errors: [{ messageId: 'unusedVariable', data: { name: 'skipped' } }],
    },
  ],
});
