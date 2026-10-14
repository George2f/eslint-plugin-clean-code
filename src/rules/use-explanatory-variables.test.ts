import { ruleTester } from '../test-utils/rule-tester';
import rule from './use-explanatory-variables';

ruleTester.run('use-explanatory-variables', rule, {
  valid: [
    'if (user.name) {}',
    'fn(user.name);',
    'const item = user.items[0];',
    {
      code: 'if (a.get("x")[0] === "root") {}',
      options: [{ minComplexLookups: 2 }],
    },
  ],
  invalid: [
    {
      code: 'if (line.split(":")[0] === "root") {}',
      errors: [{ messageId: 'extractVariable', data: { count: 1 } }],
    },
    {
      code: 'fn(config.users[0].name);',
      errors: [{ messageId: 'extractVariable', data: { count: 1 } }],
    },
    {
      code: 'while (items[0].value > bound) { break; }',
      errors: [{ messageId: 'extractVariable', data: { count: 1 } }],
    },
    {
      code: 'if (a.get("x")[0] === b.get("y")[0]) {}',
      options: [{ minComplexLookups: 2 }],
      errors: [{ messageId: 'extractVariable', data: { count: 2 } }],
    },
  ],
});
