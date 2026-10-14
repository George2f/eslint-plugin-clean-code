import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getChainRoot, getPropertyName, unwrap } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

const SKIPPED_TEST_PREFIX = /^x(?:it|test|describe|specify|context)$/;

export default createRule({
  name: 'no-skipped-tests',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow skipped tests (Clean Code T3)',
      cleanCodeId: 'T3',
      cleanCodeRule: "Don't Skip Trivial Tests",
    },
    messages: {
      skippedTest:
        'Skipped test "{{name}}" hides broken behavior; make it pass or delete it (Clean Code T3).',
      unskipTest: 'Un-skip the test.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          testFunctions: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ testFunctions: ['it', 'test', 'describe', 'context', 'suite', 'specify'] }],
  create(context, [options]) {
    function isFrameworkReference(identifier: TSESTree.Identifier): boolean {
      return !isLocallyBound(getVariable(context.sourceCode, identifier));
    }
    return {
      CallExpression(node) {
        const callee = unwrap(node.callee);
        if (callee.type === 'Identifier') {
          if (SKIPPED_TEST_PREFIX.test(callee.name) && isFrameworkReference(callee)) {
            context.report({
              node: callee,
              messageId: 'skippedTest',
              data: { name: callee.name },
              suggest: [
                {
                  messageId: 'unskipTest',
                  fix: fixer => fixer.replaceText(callee, callee.name.slice(1)),
                },
              ],
            });
          }
          return;
        }
        if (callee.type !== 'MemberExpression') return;
        let current: TSESTree.Node = callee;
        while (current.type === 'MemberExpression') {
          if (getPropertyName(current.property) === 'skip') {
            const root = getChainRoot(current);
            if (
              root.type === 'Identifier' &&
              options.testFunctions.includes(root.name) &&
              isFrameworkReference(root)
            ) {
              const member = current;
              context.report({
                node: member,
                messageId: 'skippedTest',
                data: { name: root.name },
                suggest: [
                  {
                    messageId: 'unskipTest',
                    fix: fixer =>
                      fixer.removeRange([member.object.range[1], member.property.range[1]]),
                  },
                ],
              });
            }
          }
          current = current.object;
        }
      },
    };
  },
});
