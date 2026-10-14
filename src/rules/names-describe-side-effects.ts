import { createRule } from '../utils/create-rule';
import { getFunctionName } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';
import { splitWords } from '../utils/naming';
import { analyzeMutations } from '../utils/functions';

export default createRule({
  name: 'names-describe-side-effects',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require names that describe side effects (Clean Code N7)',
      cleanCodeId: 'N7',
      cleanCodeRule: 'Names Should Describe Side Effects',
    },
    messages: {
      nameHidesSideEffect:
        'Function "{{name}}" sounds side-effect free but mutates state; rename it to describe the side effect (Clean Code N7).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          prefixes: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ prefixes: ['get', 'is', 'has', 'find'] }],
  create(context, [options]) {
    const prefixes = new Set(options.prefixes);

    function check(node: FunctionNode): void {
      const name = getFunctionName(node);
      if (!name) return;
      const firstWord = splitWords(name)[0];
      if (!firstWord || !prefixes.has(firstWord)) return;
      const analysis = analyzeMutations(node, context.sourceCode);
      if (!analysis.mutatesThis && analysis.mutatedOuterVariables.size === 0) return;
      context.report({
        node,
        messageId: 'nameHidesSideEffect',
        data: { name },
      });
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
