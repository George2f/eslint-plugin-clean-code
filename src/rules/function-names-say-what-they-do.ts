import { createRule } from '../utils/create-rule';
import { getFunctionName } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';

const DEFAULT_FORBIDDEN = [
  'handle',
  'process',
  'manage',
  'util',
  'utils',
  'misc',
  'stuff',
  'thing',
  'data',
  'info',
  'temp',
  'tmp',
  'foo',
  'bar',
  'baz',
  'func',
  'fn',
  'callback',
  'cb',
  'do',
  'perform',
  'execute',
  'handleData',
  'doStuff',
  'doWork',
  'doIt',
];

export default createRule({
  name: 'function-names-say-what-they-do',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require function names that say what they do (Clean Code G20)',
      cleanCodeId: 'G20',
      cleanCodeRule: 'Function Names Should Say What They Do',
    },
    messages: {
      vagueFunctionName:
        'Function name "{{name}}" is too vague; rename it to say what the function does (Clean Code G20).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          forbidden: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ forbidden: DEFAULT_FORBIDDEN }],
  create(context, [options]) {
    const forbidden = new Set(options.forbidden.map(name => name.toLowerCase()));

    function check(node: FunctionNode): void {
      const name = getFunctionName(node);
      if (!name || !forbidden.has(name.toLowerCase())) return;
      context.report({
        node,
        messageId: 'vagueFunctionName',
        data: { name },
      });
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
