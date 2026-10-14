import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-inappropriate-statics';

ruleTester.run('no-inappropriate-statics', rule, {
  valid: [
    'class Service { build() {} }',
    'class Mixed { static create() {} use() {} }',
    'class Empty {}',
    'class Registry { static map = {}; get() {} }',
  ],
  invalid: [
    {
      code: 'class Utils { static format(s) { return s; } static parse(s) { return s; } }',
      errors: [{ messageId: 'allStaticClass', data: { name: 'Utils' } }],
    },
    {
      code: 'const M = class { static go() {} };',
      errors: [{ messageId: 'allStaticClass', data: { name: '<anonymous>' } }],
    },
    {
      code: 'const M = class Named { static go() {} };',
      errors: [{ messageId: 'allStaticClass', data: { name: 'Named' } }],
    },
    {
      code: 'class Config { static value = 1; static read() { return Config.value; } }',
      errors: [{ messageId: 'allStaticClass', data: { name: 'Config' } }],
    },
  ],
});
