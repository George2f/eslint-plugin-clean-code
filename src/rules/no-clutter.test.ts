import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-clutter';

ruleTester.run('no-clutter', rule, {
  valid: [
    'const x = 1;',
    'for (;;) { break; }',
    'class C { constructor(a) { super(a); this.a = a; } }',
    'class E extends B { constructor(a) { super(a); this.x = a; } }',
    'class F extends B { constructor(a) { super(a); } }',
  ],
  invalid: [
    {
      code: 'const x = 1;;',
      output: 'const x = 1;',
      errors: [{ messageId: 'emptyStatement' }],
    },
    {
      code: 'while (ready);',
      output: 'while (ready) {}',
      errors: [{ messageId: 'emptyStatement' }],
    },
    {
      code: 'for (let i = 0; i < 2; i++);',
      output: 'for (let i = 0; i < 2; i++) {}',
      errors: [{ messageId: 'emptyStatement' }],
    },
    {
      code: 'class C extends B { constructor(...args) { super(...args); } }',
      output: 'class C extends B {  }',
      errors: [{ messageId: 'uselessConstructor' }],
    },
    {
      code: 'class D { constructor() {} }',
      output: 'class D {  }',
      errors: [{ messageId: 'uselessConstructor' }],
    },
    {
      code: 'class E extends B { constructor() {} }',
      output: null,
      errors: [{ messageId: 'uselessConstructor' }],
    },
    {
      code: 'function f() { debugger; }',
      output: null,
      errors: [
        {
          messageId: 'debugger',
          suggestions: [{ messageId: 'removeDebugger', output: 'function f() {  }' }],
        },
      ],
    },
  ],
});
