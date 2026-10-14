import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-base-class-knowing-derivatives';

ruleTester.run('no-base-class-knowing-derivatives', rule, {
  valid: [
    'class Base {}\nclass Derived extends Base { make() { return new Base(); } }',
    'class A {}\nclass B {}',
    'class Base { create() { return 1; } }\nclass Derived extends Base {}',
    'class Base {}\nclass Derived extends Base {}\nclass Other { run() { return new Derived(); } }',
  ],
  invalid: [
    {
      code: 'class Base { create() { return new Derived(); } }\nclass Derived extends Base {}',
      errors: [{ messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'Derived' } }],
    },
    {
      code: 'class Base { run() { this.helper(new Derived()); } }\nclass Derived extends Base {}',
      errors: [{ messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'Derived' } }],
    },
    {
      code: 'class Base { make(kind) { if (kind) return new Foo(); return new Bar(); } }\nclass Foo extends Base {}\nclass Bar extends Base {}',
      errors: [
        { messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'Foo' } },
        { messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'Bar' } },
      ],
    },
    {
      code: 'class Base { a() { return new D1(); } b() { return D1.name; } }\nclass D1 extends Base {}',
      errors: [
        { messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'D1' } },
        { messageId: 'baseClassKnowsDerivative', data: { name: 'Base', derivative: 'D1' } },
      ],
    },
  ],
});
