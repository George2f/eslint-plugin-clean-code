import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type MessageIds = 'extractVariable';
type Options = { minComplexLookups: number }[];
type ExplanatoryVariablesContext = TSESLint.RuleContext<MessageIds, Options>;

const SKIPPED_ARGUMENT_TYPES = new Set([
  'ObjectExpression',
  'ArrayExpression',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'Literal',
  'TemplateLiteral',
  'TaggedTemplateExpression',
]);

type ExpressionCheck = (expression: TSESTree.Node) => void;

function isComplexLookup(node: TSESTree.Node): boolean {
  if (node.type !== 'CallExpression' && !(node.type === 'MemberExpression' && node.computed)) {
    return false;
  }
  const parent = node.parent;
  return parent.type === 'MemberExpression' && parent.object === node;
}

function isFunctionBoundary(node: TSESTree.Node): boolean {
  if (node.type === 'FunctionDeclaration') return true;
  if (node.type === 'FunctionExpression') return true;
  return node.type === 'ArrowFunctionExpression';
}

function shouldDescendExpression(current: TSESTree.Node, expression: TSESTree.Node): boolean {
  if (current === expression) return true;
  return !isFunctionBoundary(current);
}

function countComplexLookups(expression: TSESTree.Node, visitorKeys: VisitorKeys): number {
  let count = 0;
  walk(
    expression,
    visitorKeys,
    current => {
      if (isComplexLookup(current)) count += 1;
    },
    { shouldDescend: current => shouldDescendExpression(current, expression) },
  );
  return count;
}

function createChecker(
  context: ExplanatoryVariablesContext,
  visitorKeys: VisitorKeys,
  options: Options[number],
): ExpressionCheck {
  const reportedRanges: TSESTree.Range[] = [];
  return expression => {
    const alreadyReported = reportedRanges.some(
      range => expression.range[0] >= range[0] && expression.range[1] <= range[1],
    );
    if (alreadyReported) return;
    const count = countComplexLookups(expression, visitorKeys);
    if (count < options.minComplexLookups) return;
    reportedRanges.push(expression.range);
    context.report({
      node: expression,
      messageId: 'extractVariable',
      data: { count },
    });
  };
}

function checkArguments(
  node: TSESTree.CallExpression,
  check: ExpressionCheck,
): void {
  for (const argument of node.arguments) {
    if (SKIPPED_ARGUMENT_TYPES.has(argument.type)) continue;
    check(argument);
  }
}

function createListeners(check: ExpressionCheck): TSESLint.RuleListener {
  return {
    IfStatement: node => check(node.test),
    WhileStatement: node => check(node.test),
    DoWhileStatement: node => check(node.test),
    ConditionalExpression: node => check(node.test),
    CallExpression: node => checkArguments(node, check),
  };
}

export default createRule({
  name: 'use-explanatory-variables',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require complex lookups in conditions and call arguments to be assigned to explanatory variables (Clean Code G19)',
      cleanCodeId: 'G19',
      cleanCodeRule: 'Use Explanatory Variables',
    },
    messages: {
      extractVariable:
        'This expression contains {{count}} complex lookup(s); assign them to explanatory variables (Clean Code G19).',
    },
    schema: [
      {
        type: 'object',
        properties: { minComplexLookups: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minComplexLookups: 1 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const check = createChecker(context, visitorKeys, options);
    return createListeners(check);
  },
});
