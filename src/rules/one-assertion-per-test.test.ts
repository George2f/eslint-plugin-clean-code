import { ruleTester } from '../test-utils/rule-tester';
import rule from './one-assertion-per-test';

ruleTester.run('one-assertion-per-test', rule, {
  valid: [
    "it('adds', () => { expect(add(1, 2)).toBe(3); });",
    "describe('x', () => { expect(1).toBe(1); expect(2).toBe(2); });",
    "it('no asserts', () => { setup(); });",
    "it('expression body', () => expect(1).toBe(1));",
    "const test = () => {};\ntest('x', () => { expect(1).toBe(1); expect(2).toBe(2); });",
    {
      code: "it('adds', () => { expect(1).toBe(1); expect(2).toBe(2); });",
      options: [{ maxAssertions: 2, testFunctions: ['it', 'test'] }],
    },
  ],
  invalid: [
    {
      code: "import { test } from 'node:test';\ntest('checks', () => { expect(1).toBe(1); expect(2).toBe(2); });",
      errors: [{ messageId: 'multipleAssertions', data: { count: 2 } }],
    },
    {
      code: "it('adds', () => { expect(add(1, 2)).toBe(3); expect(add(2, 2)).toBe(4); });",
      errors: [{ messageId: 'multipleAssertions', data: { count: 2 } }],
    },
    {
      code: "test('checks', () => { assert(a); assert(b); });",
      errors: [{ messageId: 'multipleAssertions', data: { count: 2 } }],
    },
    {
      code: "it.only('checks', () => { expect(1).toBe(1); expect(2).toBe(2); expect(3).toBe(3); });",
      errors: [{ messageId: 'multipleAssertions', data: { count: 3 } }],
    },
    {
      code: "test.concurrent('checks', () => { expect(1).toBe(1); expect(2).toBe(2); });",
      errors: [{ messageId: 'multipleAssertions', data: { count: 2 } }],
    },
  ],
});
