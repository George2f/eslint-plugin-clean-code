import type { TSESTree } from '@typescript-eslint/utils';
import { unwrap } from '../utils/ast';
import { createRule } from '../utils/create-rule';

const EQUALITY_OPERATORS = new Set(['===', '==', '!==', '!=']);

function isFloatingPointLiteral(node: TSESTree.Node): node is TSESTree.Literal {
  return node.type === 'Literal' && typeof node.value === 'number' && !Number.isInteger(node.value);
}

export default createRule({
  name: 'be-precise',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow imprecise operations such as float equality and parseInt without a radix (Clean Code G26)',
      cleanCodeId: 'G26',
      cleanCodeRule: 'Be Precise',
    },
    messages: {
      floatEquality:
        'Avoid equality comparisons with the floating point literal {{value}}; compare within a tolerance instead (Clean Code G26).',
      parseIntWithoutRadix:
        'Specify the radix argument when calling parseInt (Clean Code G26).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node) {
        if (!EQUALITY_OPERATORS.has(node.operator)) return;
        const left = unwrap(node.left);
        if (isFloatingPointLiteral(left)) {
          context.report({ node: left, messageId: 'floatEquality', data: { value: left.value } });
          return;
        }
        const right = unwrap(node.right);
        if (isFloatingPointLiteral(right)) {
          context.report({ node: right, messageId: 'floatEquality', data: { value: right.value } });
        }
      },
      CallExpression(node) {
        const callee = unwrap(node.callee);
        if (
          callee.type === 'Identifier' &&
          callee.name === 'parseInt' &&
          node.arguments.length === 1
        ) {
          context.report({ node, messageId: 'parseIntWithoutRadix' });
        }
      },
    };
  },
});
