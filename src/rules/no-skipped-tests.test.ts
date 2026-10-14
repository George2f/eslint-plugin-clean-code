import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-skipped-tests';

ruleTester.run('no-skipped-tests', rule, {
  valid: [
    "it('works', () => {});",
    "it.only('works', () => {});",
    "test.todo('later');",
    "foo.skip('later', () => {});",
    "test('x', (context) => { context.skip('sandbox unavailable'); });",
    {
      code: "it.skip('works', () => {});",
      options: [{ testFunctions: ['given'] }],
    },
  ],
  invalid: [
    {
      code: "import { test } from 'node:test';\ntest.skip('works', () => {});",
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'test' },
          suggestions: [
            {
              messageId: 'unskipTest',
              output: "import { test } from 'node:test';\ntest('works', () => {});",
            },
          ],
        },
      ],
    },
    {
      code: "it.skip('works', () => {});",
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'it' },
          suggestions: [
            { messageId: 'unskipTest', output: "it('works', () => {});" },
          ],
        },
      ],
    },
    {
      code: "describe.skip('group', () => {});",
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'describe' },
          suggestions: [
            { messageId: 'unskipTest', output: "describe('group', () => {});" },
          ],
        },
      ],
    },
    {
      code: "xit('works', () => {});",
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'xit' },
          suggestions: [{ messageId: 'unskipTest', output: "it('works', () => {});" }],
        },
      ],
    },
    {
      code: "suite.skip('group', () => {});",
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'suite' },
          suggestions: [
            { messageId: 'unskipTest', output: "suite('group', () => {});" },
          ],
        },
      ],
    },
    {
      code: "given.skip('x', () => {});",
      options: [{ testFunctions: ['given'] }],
      output: null,
      errors: [
        {
          messageId: 'skippedTest',
          data: { name: 'given' },
          suggestions: [{ messageId: 'unskipTest', output: "given('x', () => {});" }],
        },
      ],
    },
  ],
});
