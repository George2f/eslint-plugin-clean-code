import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-todo-tests';

ruleTester.run('no-todo-tests', rule, {
  valid: [
    "it('works', () => { expect(1).toBe(1); });",
    "it.only('works', () => { const x = 1; });",
    "describe('group', () => {});",
    "it.skip('works', () => {});",
    "it('x', (context) => { context.todo('later'); });",
    {
      code: "todo('later');",
      options: [{ testFunctions: ['it'] }],
    },
  ],
  invalid: [
    {
      code: "import { test } from 'node:test';\ntest('works', () => {});",
      errors: [{ messageId: 'emptyTest', data: { name: 'test' } }],
    },
    {
      code: "it.todo('add later');",
      errors: [{ messageId: 'todoTest', data: { name: 'it' } }],
    },
    {
      code: "test('works', () => {});",
      errors: [{ messageId: 'emptyTest', data: { name: 'test' } }],
    },
    {
      code: "it('works', function () {});",
      errors: [{ messageId: 'emptyTest', data: { name: 'it' } }],
    },
    {
      code: "specify.only('works', () => {});",
      errors: [{ messageId: 'emptyTest', data: { name: 'specify' } }],
    },
  ],
});
