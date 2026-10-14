import tseslint from 'typescript-eslint';
import cleanCode from './dist/index.js';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ...cleanCode.configs.strictest,
    rules: {
      ...cleanCode.configs.strictest.rules,
      // walk() and swapBranches() take four cohesive parameters; mirrors dark-factory's max-params: 4.
      'clean-code/max-arguments': ['error', { max: 4 }],
    },
  },
);
