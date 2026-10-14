import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-duplication';

const duplicatedBody =
  'const user = users.find(u => u.id === userId);' +
  'const name = user.name.trim();' +
  'const email = user.email.toLowerCase();' +
  'const valid = email.length > 0;' +
  'const created = Date.now();' +
  'return { name, email, valid, created };';

const duplicatedProgram =
  'function first(userId) {' +
  duplicatedBody +
  '}' +
  'function second(userId) {' +
  duplicatedBody +
  '}';

ruleTester.run('no-duplication', rule, {
  valid: [
    'function a() { return 1; }',
    'function a() { const x = getX(); return x + 1; } function b() { const y = getY(); return y * 2; }',
    'function a() { const x = 1; const y = 2; const z = 3; return x + y + z; } function b() { const x = 1; const y = 2; const z = 3; return x + y + z; }',
    {
      code: duplicatedProgram,
      options: [{ minStatements: 8, minNodes: 25 }],
    },
  ],
  invalid: [
    {
      code: duplicatedProgram,
      errors: [{ messageId: 'duplicateCode', data: { count: 4 } }],
    },
    {
      code:
        'function a() { const user = loadUser(id); const name = user.name.trim(); const email = user.email.toLowerCase(); const ok = checkEmail(email); }' +
        'function b() { const user = loadUser(id); const name = user.name.trim(); const email = user.email.toLowerCase(); const ok = checkEmail(email); }',
      errors: [{ messageId: 'duplicateCode', data: { count: 4 } }],
    },
    {
      code:
        'function a() { const x = loadOne(); const y = loadTwo(); return x + y; }' +
        'function b() { const x = loadOne(); const y = loadTwo(); return x + y; }',
      options: [{ minStatements: 3, minNodes: 10 }],
      errors: [{ messageId: 'duplicateCode', data: { count: 3 } }],
    },
    {
      code:
        'function f() { const a = one(); const b = two(); const c = three(); const d = four(); ' +
        'const e = one(); const f2 = two(); const g = three(); const h = four(); }',
      options: [{ minStatements: 4, minNodes: 10 }],
      errors: [{ messageId: 'duplicateCode', data: { count: 4 } }],
    },
  ],
});
