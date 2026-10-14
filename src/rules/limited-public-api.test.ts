import { ruleTester } from '../test-utils/rule-tester';
import rule from './limited-public-api';

const bigClass =
  'class Big {' +
  Array.from({ length: 26 }, (_, i) => 'm' + i + '() {}').join('') +
  '}';

const bigModule = Array.from(
  { length: 51 },
  (_, i) => 'export const e' + i + ' = ' + i + ';',
).join('\n');

const boundaryModule = Array.from(
  { length: 50 },
  (_, i) => 'export const e' + i + ' = ' + i + ';',
).join('\n');

ruleTester.run('limited-public-api', rule, {
  valid: [
    'class C { m() {} n() {} }',
    'class C { constructor() {} _hidden() {} #secret = 1; }',
    'export const a = 1; export function f() {} export default class C {}',
    {
      code: bigClass,
      options: [{ maxClassMembers: 26, maxExports: 50 }],
    },
    {
      code: boundaryModule,
      options: [{ maxClassMembers: 25, maxExports: 50 }],
    },
  ],
  invalid: [
    {
      code: bigClass,
      errors: [{ messageId: 'tooManyClassMembers', data: { count: 26, max: 25 } }],
    },
    {
      code: 'const C = ' + bigClass.replace('class Big', 'class'),
      errors: [{ messageId: 'tooManyClassMembers', data: { count: 26, max: 25 } }],
    },
    {
      code: bigModule,
      errors: [{ messageId: 'tooManyExports', data: { count: 51, max: 50 } }],
    },
    {
      code: 'const x = 1; const y = 2; const z = 3; export { x, y, z };',
      options: [{ maxClassMembers: 25, maxExports: 2 }],
      errors: [{ messageId: 'tooManyExports', data: { count: 3, max: 2 } }],
    },
    {
      code: 'export const a = 1; export const b = 2; export function f() {}',
      options: [{ maxClassMembers: 25, maxExports: 2 }],
      errors: [{ messageId: 'tooManyExports', data: { count: 3, max: 2 } }],
    },
  ],
});
