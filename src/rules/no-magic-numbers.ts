import type { TSESTree } from '@typescript-eslint/utils';
import { getCalleeName, unwrap } from '../utils/ast';
import { createRule } from '../utils/create-rule';

const TYPE_NODE_PREFIX = 'TS';
const VALUE_CONTEXT_PARENTS = new Set(['ObjectExpression', 'Property', 'AssignmentExpression']);

function isParseIntRadix(fullNumberNode: TSESTree.Node): boolean {
  const parent = fullNumberNode.parent;
  if (!parent || parent.type !== 'CallExpression') return false;
  return parent.arguments[1] === fullNumberNode && getCalleeName(unwrap(parent.callee)) === 'parseInt';
}

export default createRule({
  name: 'no-magic-numbers',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow magic numbers; replace them with named constants (Clean Code G25)',
      cleanCodeId: 'G25',
      cleanCodeRule: 'Replace Magic Numbers with Named Constants',
    },
    messages: {
      magicNumber: 'Magic number {{value}}. Extract it into a named constant (Clean Code G25).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignore: { type: 'array', items: { type: 'number' } },
          ignoreDefaultValues: { type: 'boolean' },
          ignoreArrayIndexes: { type: 'boolean' },
          ignoreEnums: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      ignore: [0, 1, 2, -1],
      ignoreDefaultValues: true,
      ignoreArrayIndexes: false,
      ignoreEnums: true,
    },
  ],
  create(context, [options]) {
    const ignored = new Set(options.ignore);
    return {
      Literal(node) {
        if (typeof node.value !== 'number') return;
        const parent = node.parent;
        const isNegated = parent.type === 'UnaryExpression' && parent.operator === '-';
        const value = isNegated ? -node.value : node.value;
        if (ignored.has(value)) return;
        const fullNumberNode: TSESTree.Node = isNegated ? parent : node;
        const container = fullNumberNode.parent;
        if (container.type === 'TSLiteralType') return;
        let ancestor: TSESTree.Node | undefined = node.parent;
        while (ancestor) {
          if (ancestor.type === 'TSEnumMember') {
            if (options.ignoreEnums) return;
            break;
          }
          if (!ancestor.type.startsWith(TYPE_NODE_PREFIX) && ancestor.type !== 'Literal') break;
          ancestor = ancestor.parent;
        }
        if (parent.type === 'Property' && parent.key === node && !parent.computed) return;
        if (
          parent.type === 'MemberExpression' &&
          parent.property === node &&
          !parent.computed
        ) {
          return;
        }
        if (
          options.ignoreArrayIndexes &&
          parent.type === 'MemberExpression' &&
          parent.computed &&
          parent.property === node
        ) {
          return;
        }
        if (
          options.ignoreDefaultValues &&
          parent.type === 'AssignmentPattern' &&
          parent.right === node
        ) {
          return;
        }
        if (VALUE_CONTEXT_PARENTS.has(container.type)) return;
        if (container.type === 'VariableDeclarator') return;
        if (container.type.startsWith('JSX')) return;
        if (isParseIntRadix(fullNumberNode)) return;
        context.report({
          node: fullNumberNode,
          messageId: 'magicNumber',
          data: { value },
        });
      },
    };
  },
});
