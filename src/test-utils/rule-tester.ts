import { RuleTester as Tester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

Tester.afterAll = afterAll;
Tester.describe = describe;
Tester.it = it;
Tester.itOnly = it.only;

export const ruleTester = new Tester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
});
