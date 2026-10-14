import type { TSESTree } from '@typescript-eslint/utils';
import { countLogicalOperators } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

export default createRule({
  name: 'encapsulate-conditionals',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow complex boolean conditions; extract them into well-named functions (Clean Code G28)',
      cleanCodeId: 'G28',
      cleanCodeRule: 'Encapsulate Conditionals',
    },
    messages: {
      complexCondition:
        'Condition has {{count}} logical operators; the maximum allowed is {{max}}. Extract it into a well-named function (Clean Code G28).',
    },
    schema: [
      {
        type: 'object',
        properties: { maxLogicalOperators: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxLogicalOperators: 2 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    function check(test: TSESTree.Node): void {
      const count = countLogicalOperators(test, visitorKeys);
      if (count > options.maxLogicalOperators) {
        context.report({
          node: test,
          messageId: 'complexCondition',
          data: { count, max: options.maxLogicalOperators },
        });
      }
    }

    return {
      IfStatement(node) {
        check(node.test);
      },
      WhileStatement(node) {
        check(node.test);
      },
      DoWhileStatement(node) {
        check(node.test);
      },
      ConditionalExpression(node) {
        check(node.test);
      },
    };
  },
});
