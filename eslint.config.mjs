import tseslint from 'typescript-eslint';
import cleanCode from './dist/index.js';

const allRules = Object.fromEntries(
  Object.keys(cleanCode.rules ?? {}).map(name => [`clean-code/${name}`, 'warn']),
);

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    plugins: { 'clean-code': cleanCode },
    rules: allRules,
  },
);
