import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-output-arguments';

ruleTester.run('no-output-arguments', rule, {
  valid: [
    'function append(list, item) { return [...list, item]; }',
    'function read(src) { return src.value; }',
    'function add(list) { const copy = list.slice(); copy.push(1); return copy; }',
    'const sum = (a, b) => a + b;',
    'function total(items) { return items.reduce((acc, item) => acc + item, 0); }',
  ],
  invalid: [
    {
      code: 'function append(list, item) { list.push(item); }',
      errors: [{ messageId: 'outputArgument', data: { name: 'list' } }],
    },
    {
      code: 'function fill(target) { target.value = 1; }',
      errors: [{ messageId: 'outputArgument', data: { name: 'target' } }],
    },
    {
      code: 'function bump(state) { state.count++; }',
      errors: [{ messageId: 'outputArgument', data: { name: 'state' } }],
    },
    {
      code: 'const sortInPlace = (items) => { items.sort(); };',
      errors: [{ messageId: 'outputArgument', data: { name: 'items' } }],
    },
    {
      code: 'function reset(state = {}) { state.value = null; }',
      errors: [{ messageId: 'outputArgument', data: { name: 'state' } }],
    },
  ],
});
