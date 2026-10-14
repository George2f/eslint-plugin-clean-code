import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getChainRoot, getPropertyName, unwrap } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

const EMPTY_TEST_MODIFIERS = ['only', 'each', 'concurrent', 'failing', 'todo'];

export default createRule({
  name: 'no-todo-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow todo tests and tests with empty bodies (Clean Code T4)',
      cleanCodeId: 'T4',
      cleanCodeRule: 'An Ignored Test Is a Question about an Ambiguity',
    },
    messages: {
      todoTest:
        'Pending test "{{name}}" marks an unanswered question; resolve it or delete the test (Clean Code T4).',
      emptyTest:
        'Test "{{name}}" has an empty body; add an assertion or delete it (Clean Code T4).',
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
  defaultOptions: [{ testFunctions: ['it', 'test', 'specify'] }],
  create(context, [options]) {
    function isFrameworkReference(identifier: TSESTree.Identifier): boolean {
      return !isLocallyBound(getVariable(context.sourceCode, identifier));
    }
    return {
      CallExpression(node) {
        const callee = unwrap(node.callee);
        if (callee.type === 'MemberExpression' && getPropertyName(callee.property) === 'todo') {
          const root = getChainRoot(callee);
          if (
            root.type === 'Identifier' &&
            options.testFunctions.includes(root.name) &&
            isFrameworkReference(root)
          ) {
            context.report({
              node: callee,
              messageId: 'todoTest',
              data: { name: root.name },
            });
            return;
          }
        }
        let rootName: string | undefined;
        if (
          callee.type === 'Identifier' &&
          options.testFunctions.includes(callee.name) &&
          isFrameworkReference(callee)
        ) {
          rootName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          const property = getPropertyName(callee.property);
          const root = getChainRoot(callee);
          if (
            property !== undefined &&
            EMPTY_TEST_MODIFIERS.includes(property) &&
            root.type === 'Identifier' &&
            options.testFunctions.includes(root.name) &&
            isFrameworkReference(root)
          ) {
            rootName = root.name;
          }
        }
        if (rootName === undefined) return;
        const last = node.arguments[node.arguments.length - 1];
        if (!last) return;
        const callback = unwrap(last);
        if (
          (callback.type === 'FunctionExpression' ||
            callback.type === 'ArrowFunctionExpression') &&
          callback.body.type === 'BlockStatement' &&
          callback.body.body.length === 0
        ) {
          context.report({ node, messageId: 'emptyTest', data: { name: rootName } });
        }
      },
    };
  },
});
