import { ruleTester } from '../test-utils/rule-tester';
import rule from './command-query-separation';

ruleTester.run('command-query-separation', rule, {
  valid: [
    'function count() { let n = 0; n += 1; return n; }',
    'function getX() { return 1; }',
    'function setX(v) { state = v; }',
    'function push(arr) { arr.push(1); return arr.length; }',
    'class C { constructor() { this.total = 1; return this; } }',
  ],
  invalid: [
    {
      code: 'const obj = { count: 0 };\nfunction increment() { obj.count += 1; return obj.count; }',
      errors: [{ messageId: 'commandQuerySeparation' }],
    },
    {
      code: 'class C { total = 0; add(x) { this.total += x; return this.total; } }',
      errors: [{ messageId: 'commandQuerySeparation' }],
    },
    {
      code: 'let state = 0;\nfunction bump() { state += 1; return state > 0; }',
      errors: [{ messageId: 'commandQuerySeparation' }],
    },
    {
      code: 'let cache = [];\nfunction fill(x) { cache.push(x); return cache.length; }',
      errors: [{ messageId: 'commandQuerySeparation' }],
    },
  ],
});
