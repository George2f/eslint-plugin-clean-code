import type { TSESTree } from '@typescript-eslint/utils';
import { unwrap } from '../utils/ast';
import { createRule } from '../utils/create-rule';

function getChainDepth(node: TSESTree.MemberExpression): { depth: number; root: TSESTree.Node } {
  let depth = 0;
  let current: TSESTree.Node = node;
  while (true) {
    if (current.type === 'MemberExpression') {
      depth += 1;
      current = unwrap(current.object);
      continue;
    }
    if (current.type === 'CallExpression') {
      current = unwrap(current.callee);
      continue;
    }
    if (current.type === 'ChainExpression') {
      current = unwrap(current.expression);
      continue;
    }
    break;
  }
  return { depth, root: current };
}

export default createRule({
  name: 'law-of-demeter',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow long member chains that navigate through other objects (Clean Code G36)',
      cleanCodeId: 'G36',
      cleanCodeRule: 'Avoid Transitive Navigation',
    },
    messages: {
      tooDeepChain:
        'Message chain navigates {{depth}} levels deep; ask the object to do the work instead (Clean Code G36).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxChainLength: { type: 'integer', minimum: 0 },
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxChainLength: 3, allow: [] as string[] }],
  create(context, [options]) {
    const sourceCode = context.sourceCode;
    const allowPatterns = options.allow.map(source => new RegExp(source));
    return {
      MemberExpression(node) {
        if (node.parent.type === 'MemberExpression') return;
        const { depth, root } = getChainDepth(node);
        if (root.type === 'ThisExpression' || root.type === 'Super') return;
        if (depth <= options.maxChainLength) return;
        const text = sourceCode.getText(node);
        if (allowPatterns.some(pattern => pattern.test(text))) return;
        context.report({ node, messageId: 'tooDeepChain', data: { depth } });
      },
    };
  },
});
