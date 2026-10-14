import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-overridden-safeties';

ruleTester.run('no-overridden-safeties', rule, {
  valid: [
    'try { risky(); } catch (error) { report(error); }',
    'try { risky(); } catch { /* ignore: best effort */ }',
    'const x = 1;',
    {
      code: 'try { risky(); } catch {}',
      options: [
        { allowEmptyCatch: true, allowTsIgnore: false, requireDisableReason: true },
      ],
    },
    {
      code: '// @ts-ignore\nbroken();',
      options: [
        { allowEmptyCatch: false, allowTsIgnore: true, requireDisableReason: true },
      ],
    },
    {
      code: '// eslint-disable-next-line no-console -- CLI tool\nconsole.log(1);',
      ...({ linterOptions: { reportUnusedDisableDirectives: false } } as object),
    },
  ],
  invalid: [
    {
      code: 'try { risky(); } catch {}',
      errors: [{ messageId: 'emptyCatch' }],
    },
    {
      code: '// @ts-ignore\nbroken();',
      output: null,
      errors: [
        {
          messageId: 'tsDirective',
          data: { directive: '@ts-ignore' },
          suggestions: [
            { messageId: 'useTsExpectError', output: '// @ts-expect-error\nbroken();' },
          ],
        },
      ],
    },
    {
      code: '// @ts-nocheck\nconst x = 1;',
      output: null,
      errors: [{ messageId: 'tsDirective', data: { directive: '@ts-nocheck' } }],
    },
    {
      code: '// eslint-disable-next-line no-console\nconsole.log(1);',
      ...({ linterOptions: { reportUnusedDisableDirectives: false } } as object),
      errors: [{ messageId: 'disableWithoutReason' }],
    },
    {
      code: '/* eslint-disable no-console */\nconsole.log(1);',
      ...({ linterOptions: { reportUnusedDisableDirectives: false } } as object),
      errors: [{ messageId: 'disableWithoutReason' }],
    },
  ],
});
