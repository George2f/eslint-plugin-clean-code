import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { collectJsxComponentNames, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { getVariable } from '../utils/scope';

function isExportDeclaration(node: TSESTree.Node | undefined): boolean {
  return node?.type === 'ExportNamedDeclaration' || node?.type === 'ExportDefaultDeclaration';
}

const SUGGESTIBLE_DECLARATION_PARENTS = new Set([
  'Program',
  'BlockStatement',
  'SwitchCase',
]);

export default createRule({
  name: 'no-dead-functions',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow functions that are never referenced (Clean Code F4)',
      cleanCodeId: 'F4',
      cleanCodeRule: 'Dead Function',
    },
    messages: {
      deadFunction: 'Function "{{name}}" is never referenced; delete it (Clean Code F4).',
      removeDeadFunction: 'Remove the dead function "{{name}}".',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allow: [] as string[] }],
  create(context, [options]) {
    const sourceCode = context.sourceCode;
    const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
    const allowed = new Set(options.allow);
    const privateNameCounts = new Map<string, number>();
    const jsxComponentNames = collectJsxComponentNames(sourceCode.ast, visitorKeys);

    function isUsed(variable: TSESLint.Scope.Variable): boolean {
      if (variable.eslintUsed) return true;
      if (jsxComponentNames.has(variable.name)) return true;
      return variable.references.some(reference => reference.isRead());
    }

    function checkFunctionDeclaration(node: TSESTree.FunctionDeclaration): void {
      const identifier = node.id;
      if (!identifier || allowed.has(identifier.name)) return;
      if (isExportDeclaration(node.parent)) return;
      const variable = getVariable(sourceCode, identifier);
      if (variable && !isUsed(variable)) {
        context.report({
          node: identifier,
          messageId: 'deadFunction',
          data: { name: identifier.name },
          suggest: [
            {
              messageId: 'removeDeadFunction',
              data: { name: identifier.name },
              fix: fixer => fixer.remove(node),
            },
          ],
        });
      }
    }

    function buildDeclaratorRemovalFix(
      declarator: TSESTree.VariableDeclarator,
    ): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null) | null {
      const declaration = declarator.parent;
      if (declaration.type !== 'VariableDeclaration') return null;
      if (!SUGGESTIBLE_DECLARATION_PARENTS.has(declaration.parent.type)) return null;
      const remaining = declaration.declarations.filter(item => item !== declarator);
      if (remaining.length === 0) {
        return fixer => fixer.remove(declaration);
      }
      const remainingText = remaining
        .map(item => sourceCode.getText(item))
        .join(', ');
      return fixer => fixer.replaceText(declaration, `${declaration.kind} ${remainingText};`);
    }

    function checkVariableDeclarator(node: TSESTree.VariableDeclarator): void {
      const init = node.init;
      if (
        !init ||
        (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression')
      ) {
        return;
      }
      if (node.id.type !== 'Identifier' || allowed.has(node.id.name)) return;
      if (isExportDeclaration(node.parent.parent)) return;
      const variable = getVariable(sourceCode, node.id);
      if (variable && !isUsed(variable)) {
        const removalFix = buildDeclaratorRemovalFix(node);
        context.report({
          node: node.id,
          messageId: 'deadFunction',
          data: { name: node.id.name },
          suggest: removalFix
            ? [
                {
                  messageId: 'removeDeadFunction',
                  data: { name: node.id.name },
                  fix: removalFix,
                },
              ]
            : undefined,
        });
      }
    }

    return {
      Program(node) {
        walk(node, visitorKeys, current => {
          if (current.type === 'PrivateIdentifier') {
            privateNameCounts.set(
              current.name,
              (privateNameCounts.get(current.name) ?? 0) + 1,
            );
          }
        });
      },
      FunctionDeclaration: checkFunctionDeclaration,
      VariableDeclarator: checkVariableDeclarator,
      MethodDefinition(node) {
        if (node.key.type !== 'PrivateIdentifier') return;
        if (allowed.has(node.key.name)) return;
        if (privateNameCounts.get(node.key.name) === 1) {
          context.report({
            node: node.key,
            messageId: 'deadFunction',
            data: { name: node.key.name },
            suggest: [
              {
                messageId: 'removeDeadFunction',
                data: { name: node.key.name },
                fix: fixer => fixer.remove(node),
              },
            ],
          });
        }
      },
    };
  },
});
