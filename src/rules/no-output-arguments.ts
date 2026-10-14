import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getParamIdentifier, isFunctionNode } from '../utils/ast';
import { analyzeMutations } from '../utils/functions';

export default createRule({
  name: 'no-output-arguments',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow function parameters that the function mutates (Clean Code F2)',
      cleanCodeId: 'F2',
      cleanCodeRule: 'Output Arguments',
    },
    messages: {
      outputArgument:
        'Parameter "{{name}}" is mutated; return a new value instead of writing into an argument (Clean Code F2).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function check(node: TSESTree.FunctionLike): void {
      if (!isFunctionNode(node) || node.body.type !== 'BlockStatement') return;
      const { mutatedParameters } = analyzeMutations(node, context.sourceCode);
      if (mutatedParameters.size === 0) return;
      for (const param of node.params) {
        const identifier = getParamIdentifier(param);
        if (identifier && mutatedParameters.has(identifier.name)) {
          context.report({
            node: identifier,
            messageId: 'outputArgument',
            data: { name: identifier.name },
          });
        }
      }
    }
    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
