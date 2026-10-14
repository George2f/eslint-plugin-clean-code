import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-dead-functions';

ruleTester.run('no-dead-functions', rule, {
  valid: [
    'function used() {}\nused();',
    'export function exported() {}',
    'class C { #used() {} run() { this.#used(); } }',
    'function recursive() { recursive(); }',
    'const used = () => {};\nused();',
    'export const handler = () => {};',
    {
      code: 'function unusedHelper() {}',
      options: [{ allow: ['unusedHelper'] }],
    },
  ],
  invalid: [
    {
      code: 'function unusedHelper() {}',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'unusedHelper' },
          suggestions: [
            {
              messageId: 'removeDeadFunction',
              data: { name: 'unusedHelper' },
              output: '',
            },
          ],
        },
      ],
    },
    {
      code: 'const unused = () => {};',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'unused' },
          suggestions: [
            { messageId: 'removeDeadFunction', data: { name: 'unused' }, output: '' },
          ],
        },
      ],
    },
    {
      code: 'const unused = function () {};',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'unused' },
          suggestions: [
            { messageId: 'removeDeadFunction', data: { name: 'unused' }, output: '' },
          ],
        },
      ],
    },
    {
      code: 'class C { #unused() {} run() {} }',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'unused' },
          suggestions: [
            {
              messageId: 'removeDeadFunction',
              data: { name: 'unused' },
              output: 'class C {  run() {} }',
            },
          ],
        },
      ],
    },
    {
      code: 'function outer() { function inner() {} }\nouter();',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'inner' },
          suggestions: [
            {
              messageId: 'removeDeadFunction',
              data: { name: 'inner' },
              output: 'function outer() {  }\nouter();',
            },
          ],
        },
      ],
    },
    {
      code: 'const used = 1, unused = () => {};\nused;',
      output: null,
      errors: [
        {
          messageId: 'deadFunction',
          data: { name: 'unused' },
          suggestions: [
            {
              messageId: 'removeDeadFunction',
              data: { name: 'unused' },
              output: 'const used = 1;\nused;',
            },
          ],
        },
      ],
    },
  ],
});
