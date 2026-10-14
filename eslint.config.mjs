import tseslint from 'typescript-eslint';
import cleanCode from './dist/index.js';

// This repo holds every rule to error severity, heuristics included.
const errorRules = Object.fromEntries(
  Object.entries(cleanCode.configs.strict.rules).map(([name]) => [name, 'error']),
);

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ...cleanCode.configs.strict,
    rules: {
      ...errorRules,
      // walk() and swapBranches() take four cohesive parameters; mirrors dark-factory's max-params: 4.
      'clean-code/max-arguments': ['error', { max: 4 }],
    },
  },
);
