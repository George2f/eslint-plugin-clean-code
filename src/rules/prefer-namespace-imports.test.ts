import { ruleTester } from '../test-utils/rule-tester';
import rule from './prefer-namespace-imports';

ruleTester.run('prefer-namespace-imports', rule, {
  valid: [
    'import { a, b } from "./mod";',
    'import * as mod from "./mod";',
    'import def, { a } from "./mod";',
    'import "./side-effect";',
    {
      code: 'import { a, b, c } from "./mod";',
      options: [{ maxNamedImports: 3 }],
    },
  ],
  invalid: [
    {
      code: 'import { a, b, c, d, e, f, g, h, i, j, k } from "./mod";',
      errors: [
        { messageId: 'longImportList', data: { count: 11, max: 10, source: './mod' } },
      ],
    },
    {
      code: 'import { a, b, c } from "./mod";',
      options: [{ maxNamedImports: 2 }],
      errors: [
        { messageId: 'longImportList', data: { count: 3, max: 2, source: './mod' } },
      ],
    },
    {
      code: 'import def, { a, b } from "./mod";',
      options: [{ maxNamedImports: 1 }],
      errors: [
        { messageId: 'longImportList', data: { count: 2, max: 1, source: './mod' } },
      ],
    },
  ],
});
