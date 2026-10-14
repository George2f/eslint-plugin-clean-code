import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-negative-conditionals';

ruleTester.run('no-negative-conditionals', rule, {
  valid: [
    'if (a) { doIt(); } else { skipIt(); }',
    'if (!a) { doIt(); }',
    'if (!a) { doIt(); } else if (b) { other(); }',
    'const x = a ? 1 : 2;',
    'if (a !== b) { doIt(); } else { skipIt(); }',
  ],
  invalid: [
    {
      code: 'if (!a) { doIt(); } else { skipIt(); }',
      output: 'if (a) { skipIt(); } else { doIt(); }',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'const x = !a ? 1 : 2;',
      output: 'const x = a ? 2 : 1;',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'if (!isReady()) { wait(); } else { proceed(); }',
      output: 'if (isReady()) { proceed(); } else { wait(); }',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'if (!ok) start(); else stop();',
      output: 'if (ok) stop(); else start();',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'if (!ready) {\n  // waiting\n  wait();\n} else {\n  // going\n  go();\n}',
      output: 'if (ready) {\n  // going\n  go();\n} else {\n  // waiting\n  wait();\n}',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'if (!!value) { a(); } else { b(); }',
      output: 'if (value) { a(); } else { b(); }',
      errors: [{ messageId: 'negativeCondition' }],
    },
    {
      code: 'if (!(a && b)) {\n  deny();\n} else {\n  allow();\n}',
      output: 'if ((a && b)) {\n  allow();\n} else {\n  deny();\n}',
      errors: [{ messageId: 'negativeCondition' }],
    },
  ],
});
