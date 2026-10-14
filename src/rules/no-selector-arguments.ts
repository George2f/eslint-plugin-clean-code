import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getParamIdentifier } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';
import { getVariable } from '../utils/scope';

const COMPARISON_OPERATORS = new Set(['===', '==', '!==', '!=']);

function comparesAgainstConstant(node: TSESTree.BinaryExpression, side: TSESTree.Node): boolean {
  const other = node.left === side ? node.right : node.left;
  return other.type === 'Literal' || other.type === 'MemberExpression';
}

export default createRule({
  name: 'no-selector-arguments',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow arguments used only to select behavior; split into separate functions instead (Clean Code G15)',
      cleanCodeId: 'G15',
      cleanCodeRule: 'Selector Arguments',
    },
    messages: {
      selectorArgument:
        'Parameter {{name}} is only used to select behavior; split the function instead (Clean Code G15).',
    },
    schema: [
      {
        type: 'object',
        properties: { minComparisons: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minComparisons: 2 }],
  create(context, [options]) {
    function check(node: FunctionNode): void {
      for (const param of node.params) {
        const identifier = getParamIdentifier(param);
        if (!identifier) continue;
        const variable = getVariable(context.sourceCode, identifier);
        if (!variable) continue;
        const reads = variable.references.filter(reference => reference.isRead());
        if (reads.length === 0) continue;
        let comparisons = 0;
        let usedAsSwitchDiscriminant = false;
        let isSelector = true;
        for (const reference of reads) {
          const parent = reference.identifier.parent;
          if (
            parent.type === 'BinaryExpression' &&
            COMPARISON_OPERATORS.has(parent.operator) &&
            comparesAgainstConstant(parent, reference.identifier)
          ) {
            comparisons += 1;
            continue;
          }
          if (parent.type === 'SwitchStatement' && parent.discriminant === reference.identifier) {
            usedAsSwitchDiscriminant = true;
            continue;
          }
          isSelector = false;
          break;
        }
        if (isSelector && (usedAsSwitchDiscriminant || comparisons >= options.minComparisons)) {
          context.report({
            node: identifier,
            messageId: 'selectorArgument',
            data: { name: identifier.name },
          });
        }
      }
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
