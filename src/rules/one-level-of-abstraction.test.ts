import { ruleTester } from '../test-utils/rule-tester';
import rule from './one-level-of-abstraction';

ruleTester.run('one-level-of-abstraction', rule, {
  valid: [
    'function orchestrate() { this.stepOne(); this.stepTwo(); }',
    'function normalize(s) { return s.trim().toLowerCase().split(" ").join("-"); }',
    'function add(a, b) { return a + b; }',
    'function outer() { function inner() { return line.slice(0, 3) + a.trim() + b.toLowerCase(); } this.stepOne(); this.stepTwo(); }',
    {
      code: 'function f(line) { const head = line.slice(0, 3); const rest = line.trim().toLowerCase(); this.validate(head); this.process(rest); }',
      options: [{ minLowLevelOps: 5, minHighLevelCalls: 5 }],
    },
  ],
  invalid: [
    {
      code: 'function f(line) { const head = line.slice(0, 3); const rest = line.trim().toLowerCase(); this.validate(head); this.process(rest); }',
      errors: [{ messageId: 'mixedAbstractionLevels', data: { low: 3, high: 2 } }],
    },
    {
      code: 'function parse(input) { const a = input.split(" "); const b = input.indexOf("x"); const c = input.substring(1); const d = input.replace("a", "b"); format(a); save(b); }',
      errors: [{ messageId: 'mixedAbstractionLevels', data: { low: 4, high: 2 } }],
    },
    {
      code: 'function compute(n) { const x = n + 1; const y = n * 2; const z = n / 3; console.log(x); render(y); }',
      errors: [{ messageId: 'mixedAbstractionLevels', data: { low: 3, high: 2 } }],
    },
    {
      code: 'function scan(text) { const a = text.replace(/\\s/g, ""); const b = text.split(","); const c = text.indexOf("x"); const d = /foo/.test(text); handle(a); emit(b); }',
      errors: [{ messageId: 'mixedAbstractionLevels', data: { low: 5, high: 3 } }],
    },
    {
      code: 'function f(s) { this.render(s.trim()); }',
      options: [{ minLowLevelOps: 1, minHighLevelCalls: 1 }],
      errors: [{ messageId: 'mixedAbstractionLevels', data: { low: 1, high: 1 } }],
    },
  ],
});
