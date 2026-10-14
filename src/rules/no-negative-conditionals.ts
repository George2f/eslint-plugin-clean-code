import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

function isNegation(node: TSESTree.Node): node is TSESTree.UnaryExpression {
  return node.type === 'UnaryExpression' && node.operator === '!';
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
    const sourceCode = context.sourceCode;

    function collectBangTokens(test: TSESTree.UnaryExpression): TSESTree.Token[] {
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
      test: TSESTree.UnaryExpression,
      consequent: TSESTree.Node,
      alternate: TSESTree.Node,
    ): TSESLint.RuleFix[] {
      const bangs = collectBangTokens(test);
      if (bangs.length === 0) return [];
      const fixes: TSESLint.RuleFix[] = bangs.map(token => fixer.remove(token));
      if (bangs.length % 2 === 1) {
        const consequentText = sourceCode.getText(consequent);
        const alternateText = sourceCode.getText(alternate);
        fixes.push(
          fixer.replaceText(consequent, alternateText),
          fixer.replaceText(alternate, consequentText),
        );
      }
      return fixes;
    }

    return {
      IfStatement(node) {
        if (!node.alternate || node.alternate.type === 'IfStatement') return;
        if (isNegation(node.test)) {
          const { test, consequent, alternate } = node;
          context.report({
            node: test,
            messageId: 'negativeCondition',
            fix: fixer => swapBranches(fixer, test, consequent, alternate),
          });
        }
      },
      ConditionalExpression(node) {
        if (isNegation(node.test)) {
          const { test, consequent, alternate } = node;
          context.report({
            node: test,
            messageId: 'negativeCondition',
            fix: fixer => swapBranches(fixer, test, consequent, alternate),
          });
        }
      },
    };
  },
});
