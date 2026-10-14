import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

type MessageIds = 'negativeCondition';
type NegativeConditionContext = TSESLint.RuleContext<MessageIds, never[]>;

interface SwapTarget {
  test: TSESTree.UnaryExpression;
  consequent: TSESTree.Node;
  alternate: TSESTree.Node;
}

function isNegation(node: TSESTree.Node): node is TSESTree.UnaryExpression {
  return node.type === 'UnaryExpression' && node.operator === '!';
}

function collectBangTokens(
  test: TSESTree.UnaryExpression,
  sourceCode: TSESLint.SourceCode,
): TSESTree.Token[] {
  const tokens: TSESTree.Token[] = [];
  let current: TSESTree.Node = test;
  while (current.type === 'UnaryExpression' && current.operator === '!') {
    const token = sourceCode.getFirstToken(current);
    if (!token || token.value !== '!') break;
    tokens.push(token);
    current = current.argument;
  }
  return tokens;
}

function swapBranches(
  fixer: TSESLint.RuleFixer,
  target: SwapTarget,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] {
  const bangs = collectBangTokens(target.test, sourceCode);
  if (bangs.length === 0) return [];
  const fixes: TSESLint.RuleFix[] = bangs.map(token => fixer.remove(token));
  if (bangs.length % 2 === 1) {
    const consequentText = sourceCode.getText(target.consequent);
    const alternateText = sourceCode.getText(target.alternate);
    fixes.push(
      fixer.replaceText(target.consequent, alternateText),
      fixer.replaceText(target.alternate, consequentText),
    );
  }
  return fixes;
}

function reportNegativeCondition(
  context: NegativeConditionContext,
  test: TSESTree.UnaryExpression,
  branches: { consequent: TSESTree.Node; alternate: TSESTree.Node },
): void {
  const sourceCode = context.sourceCode;
  context.report({
    node: test,
    messageId: 'negativeCondition',
    fix: fixer => swapBranches(fixer, { test, ...branches }, sourceCode),
  });
}

function checkIfStatement(
  node: TSESTree.IfStatement,
  context: NegativeConditionContext,
): void {
  if (!node.alternate || node.alternate.type === 'IfStatement') return;
  if (!isNegation(node.test)) return;
  const { test, consequent, alternate } = node;
  reportNegativeCondition(context, test, { consequent, alternate });
}

function checkConditionalExpression(
  node: TSESTree.ConditionalExpression,
  context: NegativeConditionContext,
): void {
  if (!isNegation(node.test)) return;
  const { test, consequent, alternate } = node;
  reportNegativeCondition(context, test, { consequent, alternate });
}

export default createRule({
  name: 'no-negative-conditionals',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Disallow negated conditions when both branches exist (Clean Code G29)',
      cleanCodeId: 'G29',
      cleanCodeRule: 'Avoid Negative Conditionals',
    },
    messages: {
      negativeCondition:
        'Avoid negative conditionals; flip the branches so the condition reads positively (Clean Code G29).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      IfStatement: node => checkIfStatement(node, context),
      ConditionalExpression: node => checkConditionalExpression(node, context),
    };
  },
});
