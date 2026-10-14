import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-pass-null';

ruleTester.run('no-pass-null', rule, {
  valid: [
    'configure(options, undefined);',
    'const ref = useRef(null);',
    'fn(a, b);',
    {
      code: 'configure(null);',
      options: [{ ignoreCallees: ['^configure$'] }],
    },
    'useState(null);',
  ],
  invalid: [
    {
      code: 'configure(options, null);',
      errors: [{ messageId: 'nullArgument', data: { callee: 'configure' } }],
    },
    {
      code: 'new Logger(null);',
      errors: [{ messageId: 'nullArgument', data: { callee: 'Logger' } }],
    },
    {
      code: 'api.send(payload, null);',
      errors: [{ messageId: 'nullArgument', data: { callee: 'send' } }],
    },
    {
      code: '(function () {})(null);',
      errors: [{ messageId: 'nullArgument', data: { callee: '(anonymous)' } }],
    },
    {
      code: 'new api.Client(null);',
      errors: [{ messageId: 'nullArgument', data: { callee: 'Client' } }],
    },
  ],
});
