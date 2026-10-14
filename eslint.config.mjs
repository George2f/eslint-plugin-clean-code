import tseslint from 'typescript-eslint';
import cleanCode from './dist/index.js';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ...cleanCode.configs.strict,
    rules: {
      ...cleanCode.configs.strict.rules,
      // walk() and swapBranches() take four cohesive parameters; mirrors dark-factory's max-params: 4.
      'clean-code/max-arguments': ['error', { max: 4 }],
    },
  },
  {
    // Rule tests assert on literal line/column/option numbers; mirrors dark-factory's test relaxations.
    files: ['**/*.test.ts', 'tests/**/*.ts'],
    rules: { 'clean-code/no-magic-numbers': 'off' },
  },
);
