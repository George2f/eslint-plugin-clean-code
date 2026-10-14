import type { TSESTree } from '@typescript-eslint/utils';
import { getPropertyName } from '../utils/ast';
import { createRule } from '../utils/create-rule';

function isPublicMember(
  member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition,
): boolean {
  if (member.key.type === 'PrivateIdentifier') return false;
  const name = getPropertyName(member.key);
  return name === undefined || !name.startsWith('_');
}

export default createRule({
  name: 'limited-public-api',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow classes or modules that expose too many public members (Clean Code G8)',
      cleanCodeId: 'G8',
      cleanCodeRule: 'Too Much Information',
    },
    messages: {
      tooManyClassMembers:
        'Class exposes {{count}} public members; the maximum allowed is {{max}}. Split the class or reduce its public surface (Clean Code G8).',
      tooManyExports:
        'Module exports {{count}} members; the maximum allowed is {{max}}. Split the module or reduce its public API (Clean Code G8).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxClassMembers: { type: 'integer', minimum: 0 },
          maxExports: { type: 'integer', minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxClassMembers: 25, maxExports: 50 }],
  create(context, [options]) {
    function checkClass(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): void {
      let count = 0;
      for (const member of node.body.body) {
        if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') continue;
        if (member.type === 'MethodDefinition' && member.kind === 'constructor') continue;
        if (isPublicMember(member)) count += 1;
      }
      if (count > options.maxClassMembers) {
        context.report({
          node,
          messageId: 'tooManyClassMembers',
          data: { count, max: options.maxClassMembers },
        });
      }
    }
    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
      'Program:exit'(node: TSESTree.Program) {
        let count = 0;
        for (const statement of node.body) {
          if (statement.type === 'ExportNamedDeclaration') {
            if (statement.declaration) {
              count +=
                statement.declaration.type === 'VariableDeclaration'
                  ? statement.declaration.declarations.length
                  : 1;
            } else {
              count += statement.specifiers.length;
            }
          } else if (
            statement.type === 'ExportDefaultDeclaration' ||
            statement.type === 'ExportAllDeclaration'
          ) {
            count += 1;
          }
        }
        if (count > options.maxExports) {
          context.report({
            node,
            messageId: 'tooManyExports',
            data: { count, max: options.maxExports },
          });
        }
      },
    };
  },
});
