import { ruleTester } from '../test-utils/rule-tester';
import rule from './law-of-demeter';

ruleTester.run('law-of-demeter', rule, {
  valid: [
    'const name = order.customer.name;',
    'const names = users.filter(Boolean).map(String);',
    'this.store.userRepo.find(id);',
    { code: 'const x = a.b.c.d.e;', options: [{ maxChainLength: 3, allow: ['^a\\.'] }] },
    { code: 'const x = a.b.c.d.e;', options: [{ maxChainLength: 5, allow: [] }] },
  ],
  invalid: [
    {
      code: 'const zip = order.customer.address.city.zip;',
      errors: [{ messageId: 'tooDeepChain', data: { depth: 4 } }],
    },
    {
      code: 'const x = a.b.c.d.e;',
      errors: [{ messageId: 'tooDeepChain', data: { depth: 4 } }],
    },
    {
      code: 'const value = store.account.owner.address.zip;',
      errors: [{ messageId: 'tooDeepChain', data: { depth: 4 } }],
    },
    {
      code: 'service.getClient().getRepo().getData().name;',
      errors: [{ messageId: 'tooDeepChain', data: { depth: 4 } }],
    },
  ],
});
