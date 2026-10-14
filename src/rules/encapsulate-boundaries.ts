import type { TSESTree } from '@typescript-eslint/utils';
import { getPropertyName, unwrap } from '../utils/ast';
import { createRule } from '../utils/create-rule';

const BOUNDARY_PROPERTIES = new Set(['length', 'size', 'count']);

function isNumericLiteral(node: TSESTree.Node): boolean {
  return node.type === 'Literal' && typeof node.value === 'number';
}

function getBoundaryProperty(node: TSESTree.Node): string | undefined {
  const target = unwrap(node);
  if (target.type !== 'MemberExpression') return undefined;
  const property = getPropertyName(target.property);
  return property && BOUNDARY_PROPERTIES.has(property) ? property : undefined;
}

export default createRule({
  name: 'encapsulate-boundaries',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow inline offset arithmetic on boundary members such as length, size and count (Clean Code G33)',
      cleanCodeId: 'G33',
      cleanCodeRule: 'Encapsulate Boundary Conditions',
    },
    messages: {
      boundaryCondition:
        'Inline offset arithmetic on "{{property}}" hides a boundary condition; encapsulate it in a named helper (Clean Code G33).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '+' && node.operator !== '-') return;
        let property: string | undefined;
        if (isNumericLiteral(node.left)) {
          property = getBoundaryProperty(node.right);
        }
        if (!property && isNumericLiteral(node.right)) {
          property = getBoundaryProperty(node.left);
        }
        if (property) {
          context.report({ node, messageId: 'boundaryCondition', data: { property } });
        }
      },
    };
  },
});
