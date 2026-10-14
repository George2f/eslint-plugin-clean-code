import { ruleTester } from '../test-utils/rule-tester';
import rule from './function-names-say-what-they-do';

ruleTester.run('function-names-say-what-they-do', rule, {
  valid: [
    'function validateOrder() {}',
    'const fetchUser = () => {};',
    'class C { render() {} }',
    'const ids = items.map(item => item.id);',
    {
      code: 'function handle() {}',
      options: [{ forbidden: ['rename'] }],
    },
  ],
  invalid: [
    {
      code: 'function handle() {}',
      errors: [{ messageId: 'vagueFunctionName', data: { name: 'handle' } }],
    },
    {
      code: 'const process = () => {};',
      errors: [{ messageId: 'vagueFunctionName', data: { name: 'process' } }],
    },
    {
      code: 'function doStuff() {}',
      errors: [{ messageId: 'vagueFunctionName', data: { name: 'doStuff' } }],
    },
    {
      code: 'class C { handle() {} }',
      errors: [{ messageId: 'vagueFunctionName', data: { name: 'handle' } }],
    },
    {
      code: 'function validateOrder() {}',
      options: [{ forbidden: ['validateOrder'] }],
      errors: [{ messageId: 'vagueFunctionName', data: { name: 'validateOrder' } }],
    },
  ],
});
