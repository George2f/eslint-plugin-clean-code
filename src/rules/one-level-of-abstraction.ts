import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getPropertyName, unwrap, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'mixedAbstractionLevels';
type Options = { minLowLevelOps: number; minHighLevelCalls: number }[];
type AbstractionContext = TSESLint.RuleContext<MessageIds, Options>;

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

interface LevelCounts {
  low: number;
  high: number;
}

function classifyCall(current: TSESTree.CallExpression): 'low' | 'high' | undefined {
  const callee = unwrap(current.callee);
  if (callee.type === 'MemberExpression') {
    const property = getPropertyName(callee.property);
    if (property === undefined) return 'high';
    return LOW_LEVEL_METHODS.has(property) ? 'low' : 'high';
  }
  if (callee.type === 'Identifier') return 'high';
  return undefined;
}

function classifyBinary(current: TSESTree.BinaryExpression): 'low' | undefined {
  if (!LOW_LEVEL_OPERATORS.has(current.operator)) return undefined;
  const left = unwrap(current.left);
  const right = unwrap(current.right);
  return left.type === 'Literal' || right.type === 'Literal' ? 'low' : undefined;
}

function classifyLevel(current: TSESTree.Node): 'low' | 'high' | undefined {
  if (current.type === 'CallExpression') return classifyCall(current);
  if (current.type === 'BinaryExpression') return classifyBinary(current);
  return current.type === 'Literal' && 'regex' in current ? 'low' : undefined;
}

function isNestedFunctionNode(node: TSESTree.Node): boolean {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function countLevels(body: TSESTree.BlockStatement, visitorKeys: VisitorKeys): LevelCounts {
  const counts: LevelCounts = { low: 0, high: 0 };
  walk(
    body,
    visitorKeys,
    current => {
      const level = classifyLevel(current);
      if (level === 'low') counts.low += 1;
      else if (level === 'high') counts.high += 1;
    },
    { shouldDescend: current => !isNestedFunctionNode(current) },
  );
  return counts;
}

function checkFunction(
  node: TSESTree.FunctionLike,
  context: AbstractionContext,
  options: Options[number],
): void {
  const body = node.body;
  if (!body || body.type !== 'BlockStatement') return;
  const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
  const counts = countLevels(body, visitorKeys);
  if (counts.low < options.minLowLevelOps || counts.high < options.minHighLevelCalls) return;
  context.report({
    node,
    messageId: 'mixedAbstractionLevels',
    data: { low: counts.low, high: counts.high },
  });
}

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
    return {
      FunctionDeclaration: node => checkFunction(node, context, options),
      FunctionExpression: node => checkFunction(node, context, options),
      ArrowFunctionExpression: node => checkFunction(node, context, options),
    };
  },
});
