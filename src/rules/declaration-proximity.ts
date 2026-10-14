import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getVariable } from '../utils/scope';

export default createRule({
  name: 'declaration-proximity',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Declare variables close to where they are first used (Clean Code G10)',
      cleanCodeId: 'G10',
      cleanCodeRule: 'Vertical Separation',
    },
    messages: {
      farFromUsage:
        'Variable {{name}} is declared {{distance}} lines before its first use; move it closer (Clean Code G10).',
    },
    schema: [
      {
        type: 'object',
        properties: { maxDistance: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxDistance: 15 }],
  create(context, [options]) {
    function check(node: TSESTree.VariableDeclarator): void {
      if (node.id.type !== 'Identifier') return;
      const declaration = node.parent;
      const parent = declaration.parent;
      if (parent.type === 'Program') return;
      if (
        parent.type === 'ForStatement' ||
        parent.type === 'ForInStatement' ||
        parent.type === 'ForOfStatement'
      ) {
        return;
      }
      const variable = getVariable(context.sourceCode, node.id);
      if (!variable) return;
      let firstUseLine: number | null = null;
      let firstUseStart = Number.POSITIVE_INFINITY;
      for (const reference of variable.references) {
        if (!reference.isRead()) continue;
        if (reference.identifier.range[0] < firstUseStart) {
          firstUseStart = reference.identifier.range[0];
          firstUseLine = reference.identifier.loc.start.line;
        }
      }
      if (firstUseLine === null) return;
      const distance = firstUseLine - node.id.loc.end.line;
      if (distance > options.maxDistance) {
        context.report({
          node,
          messageId: 'farFromUsage',
          data: { name: node.id.name, distance },
        });
      }
    }

    return {
      VariableDeclarator: check,
    };
  },
});
