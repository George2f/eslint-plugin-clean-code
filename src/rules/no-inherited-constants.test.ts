import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-inherited-constants';

ruleTester.run('no-inherited-constants', rule, {
  valid: [
    'class Base { static DEFAULT = 0; }\nclass Derived extends Base { read() { return Base.DEFAULT; } }',
    'class Service { read() { return this.value; } }',
    'class Base { static DEFAULT = 0; }\nclass Derived extends Base { read() { return Derived.OTHER; } }',
    'class Base { static DEFAULT = 0; }\nclass Derived extends Base { static DEFAULT = 1; read() { return Derived.DEFAULT; } }',
    'class Base { value = 1; }\nclass Derived extends Base { read() { return this.value; } }',
  ],
  invalid: [
    {
      code: 'class Base { static DEFAULT = 0; }\nclass Derived extends Base { read() { return Derived.DEFAULT; } }',
      errors: [{ messageId: 'inheritedConstant', data: { name: 'DEFAULT', base: 'Base' } }],
    },
    {
      code: 'class Base { static DEFAULT = 0; }\nclass Derived extends Base { read() { return super.DEFAULT; } }',
      errors: [{ messageId: 'inheritedConstant', data: { name: 'DEFAULT', base: 'Base' } }],
    },
    {
      code: 'class Base { static DEFAULT = 0; }\nclass Derived extends Base { read() { return this.DEFAULT; } }',
      errors: [{ messageId: 'inheritedConstant', data: { name: 'DEFAULT', base: 'Base' } }],
    },
    {
      code: 'class A { static MAX = 1; }\nclass B extends A {}\nclass C extends B { read() { return C.MAX; } }',
      errors: [{ messageId: 'inheritedConstant', data: { name: 'MAX', base: 'B' } }],
    },
    {
      code: 'class Base { static TIMEOUT = 30; static RETRIES = 3; }\nclass Derived extends Base { read() { return Derived.TIMEOUT + Derived.RETRIES; } }',
      errors: [
        { messageId: 'inheritedConstant', data: { name: 'TIMEOUT', base: 'Base' } },
        { messageId: 'inheritedConstant', data: { name: 'RETRIES', base: 'Base' } },
      ],
    },
  ],
});
