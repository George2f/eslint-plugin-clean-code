import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-feature-envy';

ruleTester.run('no-feature-envy', rule, {
  valid: [
    'class Report { build(customer) { return this.format(customer.name); } }',
    'class Report { build() { return this.a + this.b + this.c + this.d + this.e; } }',
    'const obj = { run() { return this.value; } };',
    'class Report { build(customer) { return customer.a + customer.b + customer.c; } }',
    'class Report { build(customer) { return function inner() { return customer.a + customer.b + customer.c + customer.d; }; } }',
  ],
  invalid: [
    {
      code: 'class Report { build(customer) { return customer.name + customer.address + customer.phone + customer.email; } }',
      errors: [{ messageId: 'featureEnvy', data: { object: 'customer', accesses: 4, ownAccesses: 0 } }],
    },
    {
      code: 'class Report { build(customer) { this.log(); return customer.a + customer.b + customer.c + customer.d; } }',
      errors: [{ messageId: 'featureEnvy', data: { object: 'customer', accesses: 4, ownAccesses: 1 } }],
    },
    {
      code: 'const helper = { render(order) { return order.a + order.b + order.c + order.d; } };',
      errors: [{ messageId: 'featureEnvy', data: { object: 'order', accesses: 4, ownAccesses: 0 } }],
    },
    {
      code: 'class R { build = (customer) => customer.a + customer.b + customer.c + customer.d; }',
      errors: [{ messageId: 'featureEnvy', data: { object: 'customer', accesses: 4, ownAccesses: 0 } }],
    },
    {
      code: 'class R { build(customer) { return customer.a + customer.b + customer.c; } }',
      options: [{ minimumAccesses: 3 }],
      errors: [{ messageId: 'featureEnvy', data: { object: 'customer', accesses: 3, ownAccesses: 0 } }],
    },
  ],
});
