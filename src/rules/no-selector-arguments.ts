import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getParamIdentifier } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';
import { getVariable } from '../utils/scope';

type MessageIds = 'selectorArgument';
type Options = { minComparisons: number }[];
type SelectorContext = TSESLint.RuleContext<MessageIds, Options>;

const COMPARISON_OPERATORS = new Set(['===', '==', '!==', '!=']);

function comparesAgainstConstant(node: TSESTree.BinaryExpression, side: TSESTree.Node): boolean {
  const other = node.left === side ? node.right : node.left;
  return other.type === 'Literal' || other.type === 'MemberExpression';
}

function isComparisonRead(reference: TSESLint.Scope.Reference): boolean {
  const parent = reference.identifier.parent;
  return (
    parent.type === 'BinaryExpression' &&
    COMPARISON_OPERATORS.has(parent.operator) &&
    comparesAgainstConstant(parent, reference.identifier)
  );
}

function isSwitchDiscriminantRead(reference: TSESLint.Scope.Reference): boolean {
  const parent = reference.identifier.parent;
  return parent.type === 'SwitchStatement' && parent.discriminant === reference.identifier;
}

function readUsage(reference: TSESLint.Scope.Reference): 'comparison' | 'switch' | 'other' {
  if (isComparisonRead(reference)) return 'comparison';
  if (isSwitchDiscriminantRead(reference)) return 'switch';
  return 'other';
}

function isSelectorParameter(
  variable: TSESLint.Scope.Variable,
  options: Options[number],
): boolean {
  const reads = variable.references.filter(reference => reference.isRead());
  if (reads.length === 0) return false;
  let comparisons = 0;
  let usedAsSwitchDiscriminant = false;
  for (const reference of reads) {
    const usage = readUsage(reference);
    if (usage === 'comparison') {
      comparisons += 1;
      continue;
    }
    if (usage === 'switch') {
      usedAsSwitchDiscriminant = true;
      continue;
    }
    return false;
  }
  return usedAsSwitchDiscriminant || comparisons >= options.minComparisons;
}

function checkParameter(
  identifier: TSESTree.Identifier,
  context: SelectorContext,
  options: Options[number],
): void {
  const variable = getVariable(context.sourceCode, identifier);
  if (!variable) return;
  if (!isSelectorParameter(variable, options)) return;
  context.report({
    node: identifier,
    messageId: 'selectorArgument',
    data: { name: identifier.name },
  });
}

function checkFunction(
  node: FunctionNode,
  context: SelectorContext,
  options: Options[number],
): void {
  for (const param of node.params) {
    const identifier = getParamIdentifier(param);
    if (identifier) checkParameter(identifier, context, options);
  }
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
    return {
      FunctionDeclaration: node => checkFunction(node, context, options),
      FunctionExpression: node => checkFunction(node, context, options),
      ArrowFunctionExpression: node => checkFunction(node, context, options),
    };
  },
});
