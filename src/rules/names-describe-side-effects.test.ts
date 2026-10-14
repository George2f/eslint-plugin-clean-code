import { ruleTester } from '../test-utils/rule-tester';
import rule from './names-describe-side-effects';

ruleTester.run('names-describe-side-effects', rule, {
  valid: [
    'function getValue() { return 42; }',
    'function findUser(users, id) { return users.find(u => u.id === id); }',
    'function setTotal(v) { total = v; }',
    'function hasAccess(user) { return user.roles.includes("admin"); }',
    {
      code: 'function getValue() { cache = 1; return cache; }',
      options: [{ prefixes: ['find'] }],
    },
  ],
  invalid: [
    {
      code: 'class Store { getTotal() { this.calls += 1; return this.total; } }',
      errors: [{ messageId: 'nameHidesSideEffect', data: { name: 'getTotal' } }],
    },
    {
      code: 'let cache = null;\nfunction getValue() { cache = compute(); return cache; }',
      errors: [{ messageId: 'nameHidesSideEffect', data: { name: 'getValue' } }],
    },
    {
      code: 'let items = [];\nfunction findFirst() { items.push(1); return items[0]; }',
      errors: [{ messageId: 'nameHidesSideEffect', data: { name: 'findFirst' } }],
    },
    {
      code: 'const isReady = () => { state.ready = true; return state.ready; };',
      errors: [{ messageId: 'nameHidesSideEffect', data: { name: 'isReady' } }],
    },
    {
      code: 'class Store { hasItems() { this.items = []; return true; } }',
      options: [{ prefixes: ['get', 'is', 'has', 'find'] }],
      errors: [{ messageId: 'nameHidesSideEffect', data: { name: 'hasItems' } }],
    },
  ],
});
