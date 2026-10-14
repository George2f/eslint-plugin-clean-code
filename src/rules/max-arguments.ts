import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

export default createRule({
  name: 'max-arguments',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of function parameters (Clean Code F1)',
      cleanCodeId: 'F1',
      cleanCodeRule: 'Too Many Arguments',
    },
    messages: {
      tooManyArguments:
        'Function has {{count}} parameters; the maximum allowed is {{max}}. Group related parameters or split the function (Clean Code F1).',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: 3 }],
  create(context, [options]) {
    function check(node: TSESTree.FunctionLike): void {
      if (node.params.length > options.max) {
        context.report({
          node,
          messageId: 'tooManyArguments',
          data: { count: node.params.length, max: options.max },
        });
      }
    }
    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
