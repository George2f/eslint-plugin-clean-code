import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getPropertyName, unwrap, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

const LOW_LEVEL_METHODS = new Set([
  'slice',
  'splice',
  'split',
  'indexOf',
  'charAt',
  'substring',
  'substr',
  'replace',
  'trim',
  'toLowerCase',
  'toUpperCase',
  'push',
  'pop',
  'shift',
  'unshift',
  'parseInt',
  'parseFloat',
  'join',
]);

const LOW_LEVEL_OPERATORS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '&',
  '|',
  '^',
  '<<',
  '>>',
  '>>>',
]);

export default createRule({
  name: 'one-level-of-abstraction',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Keep every function at a single level of abstraction (Clean Code G34)',
      cleanCodeId: 'G34',
      cleanCodeRule: 'Functions Should Descend Only One Level of Abstraction',
    },
    messages: {
      mixedAbstractionLevels:
        'Function mixes {{low}} low-level operations with {{high}} high-level calls; split it by abstraction level (Clean Code G34).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minLowLevelOps: { type: 'integer', minimum: 0 },
          minHighLevelCalls: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minLowLevelOps: 3, minHighLevelCalls: 2 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    function check(node: TSESTree.FunctionLike): void {
      const body = node.body;
      if (!body || body.type !== 'BlockStatement') return;
      let low = 0;
      let high = 0;
      walk(
        body,
        visitorKeys,
        current => {
          if (current.type === 'CallExpression') {
            const callee = unwrap(current.callee);
            if (callee.type === 'MemberExpression') {
              const property = getPropertyName(callee.property);
              if (property !== undefined && LOW_LEVEL_METHODS.has(property)) {
                low += 1;
              } else {
                high += 1;
              }
            } else if (callee.type === 'Identifier') {
              high += 1;
            }
            return;
          }
          if (
            current.type === 'BinaryExpression' &&
            LOW_LEVEL_OPERATORS.has(current.operator)
          ) {
            const left = unwrap(current.left);
            const right = unwrap(current.right);
            if (left.type === 'Literal' || right.type === 'Literal') {
              low += 1;
            }
            return;
          }
          if (current.type === 'Literal' && 'regex' in current) {
            low += 1;
          }
        },
        {
          shouldDescend: current =>
            current.type !== 'FunctionDeclaration' && current.type !== 'FunctionExpression',
        },
      );
      if (low >= options.minLowLevelOps && high >= options.minHighLevelCalls) {
        context.report({
          node,
          messageId: 'mixedAbstractionLevels',
          data: { low, high },
        });
      }
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
