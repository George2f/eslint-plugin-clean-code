import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getPropertyName } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'tooManyClassMembers' | 'tooManyExports';
type Options = { maxClassMembers: number; maxExports: number }[];
type PublicApiContext = TSESLint.RuleContext<MessageIds, Options>;

function isPublicMember(
  member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition,
): boolean {
  if (member.key.type === 'PrivateIdentifier') return false;
  const name = getPropertyName(member.key);
  return name === undefined || !name.startsWith('_');
}

function countPublicMembers(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): number {
  let count = 0;
  for (const member of node.body.body) {
    if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') continue;
    if (member.type === 'MethodDefinition' && member.kind === 'constructor') continue;
    if (isPublicMember(member)) count += 1;
  }
  return count;
}

function checkClassMembers(
  node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
  context: PublicApiContext,
  options: Options[number],
): void {
  const count = countPublicMembers(node);
  if (count <= options.maxClassMembers) return;
  context.report({
    node,
    messageId: 'tooManyClassMembers',
    data: { count, max: options.maxClassMembers },
  });
}

function exportCountOf(statement: TSESTree.ProgramStatement): number {
  if (statement.type === 'ExportNamedDeclaration') {
    if (statement.declaration) {
      return statement.declaration.type === 'VariableDeclaration'
        ? statement.declaration.declarations.length
        : 1;
    }
    return statement.specifiers.length;
  }
  if (statement.type === 'ExportDefaultDeclaration') return 1;
  if (statement.type === 'ExportAllDeclaration') return 1;
  return 0;
}

function countExports(program: TSESTree.Program): number {
  let count = 0;
  for (const statement of program.body) {
    count += exportCountOf(statement);
  }
  return count;
}

function checkExports(
  node: TSESTree.Program,
  context: PublicApiContext,
  options: Options[number],
): void {
  const count = countExports(node);
  if (count <= options.maxExports) return;
  context.report({
    node,
    messageId: 'tooManyExports',
    data: { count, max: options.maxExports },
  });
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
    return {
      ClassDeclaration: node => checkClassMembers(node, context, options),
      ClassExpression: node => checkClassMembers(node, context, options),
      'Program:exit': node => checkExports(node, context, options),
    };
  },
});
