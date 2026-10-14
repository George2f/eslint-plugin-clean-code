import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

const COMPARISON_OPERATORS = new Set(['===', '==', '!==', '!=']);

function getDiscriminant(test: TSESTree.Expression): TSESTree.Node | undefined {
  if (test.type !== 'BinaryExpression' || !COMPARISON_OPERATORS.has(test.operator)) {
    return undefined;
  }
  for (const side of [test.left, test.right]) {
    if (side.type === 'Identifier' || side.type === 'MemberExpression') return side;
  }
  return undefined;
}

export default createRule({
  name: 'prefer-polymorphism',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer polymorphism over long switch statements and if/else chains (Clean Code G23)',
      cleanCodeId: 'G23',
      cleanCodeRule: 'Prefer Polymorphism to If/Else or Switch/Case',
    },
    messages: {
      longSwitch:
        'Switch with {{count}} cases exceeds the maximum of {{max}}; prefer polymorphism (Clean Code G23).',
      longIfElseChain:
        'If/else chain with {{branches}} branches repeating the same discriminant; prefer polymorphism (Clean Code G23).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxSwitchCases: { type: 'integer', minimum: 0 },
          maxIfElseBranches: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxSwitchCases: 4, maxIfElseBranches: 5 }],
  create(context, [options]) {
    return {
      SwitchStatement(node) {
        const count = node.cases.filter(clause => clause.test !== null).length;
        if (count > options.maxSwitchCases) {
          context.report({
            node,
            messageId: 'longSwitch',
            data: { count, max: options.maxSwitchCases },
          });
        }
      },
      IfStatement(node) {
        const parent = node.parent;
        if (parent.type === 'IfStatement' && parent.alternate === node) return;
        const tests: TSESTree.Expression[] = [node.test];
        let current = node;
        while (current.alternate && current.alternate.type === 'IfStatement') {
          current = current.alternate;
          tests.push(current.test);
        }
        const branches = tests.length;
        if (branches < options.maxIfElseBranches) return;
        const counts = new Map<string, number>();
        for (const test of tests) {
          const discriminant = getDiscriminant(test);
          if (!discriminant) continue;
          const text = context.sourceCode.getText(discriminant);
          counts.set(text, (counts.get(text) ?? 0) + 1);
        }
        let mostCommon = 0;
        for (const value of counts.values()) {
          if (value > mostCommon) mostCommon = value;
        }
        if (mostCommon < branches - 1) return;
        context.report({
          node,
          messageId: 'longIfElseChain',
          data: { branches },
        });
      },
    };
  },
});
