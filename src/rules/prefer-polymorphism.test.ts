import { ruleTester } from '../test-utils/rule-tester';
import rule from './prefer-polymorphism';

ruleTester.run('prefer-polymorphism', rule, {
  valid: [
    "switch (kind) { case 'a': break; case 'b': break; case 'c': break; case 'd': break; default: break; }",
    "if (a === 1) {} else if (b === 2) {} else if (c === 3) {} else if (d === 4) {} else if (e === 5) {}",
    'if (x) {} else {}',
    {
      code: "if (status === 'a') {} else if (status === 'b') {} else if (status === 'c') {} else if (status === 'd') {} else if (status === 'e') {}",
      options: [{ maxSwitchCases: 4, maxIfElseBranches: 6 }],
    },
  ],
  invalid: [
    {
      code: "switch (kind) { case 'a': break; case 'b': break; case 'c': break; case 'd': break; case 'e': break; default: break; }",
      errors: [{ messageId: 'longSwitch', data: { count: 5, max: 4 } }],
    },
    {
      code: "if (status === 'a') {} else if (status === 'b') {} else if (status === 'c') {} else if (status === 'd') {} else if (status === 'e') {}",
      errors: [{ messageId: 'longIfElseChain', data: { branches: 5 } }],
    },
    {
      code: 'switch (k) { case 1: break; case 2: break; case 3: break; }',
      options: [{ maxSwitchCases: 2, maxIfElseBranches: 5 }],
      errors: [{ messageId: 'longSwitch', data: { count: 3, max: 2 } }],
    },
    {
      code: 'if (mode === 1) {} else if (mode === 2) {} else if (mode === 3) {}',
      options: [{ maxSwitchCases: 4, maxIfElseBranches: 3 }],
      errors: [{ messageId: 'longIfElseChain', data: { branches: 3 } }],
    },
  ],
});
