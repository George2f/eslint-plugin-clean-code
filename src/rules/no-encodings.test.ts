import { ruleTester } from '../test-utils/rule-tester';
import rule from './no-encodings';

ruleTester.run('no-encodings', rule, {
  valid: [
    'const strategy = "x";',
    'const internal = 1;',
    'const itemCount = 0;',
    'interface IUser {}',
    'type UserId = string;',
    'function compute(strategy) {}',
    {
      code: 'const wagonCount = 1;',
      options: [{ patterns: ['^cargo_'], typePrefixes: false }],
    },
  ],
  invalid: [
    {
      code: 'const strName = "x";',
      errors: [{ messageId: 'encodedName', data: { name: 'strName' } }],
    },
    {
      code: 'let arrItems = [];',
      errors: [{ messageId: 'encodedName', data: { name: 'arrItems' } }],
    },
    {
      code: 'function fnRun() {}',
      errors: [{ messageId: 'encodedName', data: { name: 'fnRun' } }],
    },
    {
      code: 'const m_count = 1;',
      errors: [{ messageId: 'encodedName', data: { name: 'm_count' } }],
    },
    {
      code: 'function f(strId) {}',
      errors: [{ messageId: 'encodedName', data: { name: 'strId' } }],
    },
    {
      code: 'interface IUser {}',
      options: [{ patterns: [], typePrefixes: true }],
      errors: [{ messageId: 'encodedName', data: { name: 'IUser' } }],
    },
    {
      code: 'const wagon_cargo = 1;',
      options: [{ patterns: ['cargo$'], typePrefixes: false }],
      errors: [{ messageId: 'encodedName', data: { name: 'wagon_cargo' } }],
    },
  ],
});
