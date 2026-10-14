import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { collectJsxComponentNames, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

const TERMINATING_STATEMENTS = new Set([
  'ReturnStatement',
  'ThrowStatement',
  'BreakStatement',
  'ContinueStatement',
]);

const SIDE_EFFECT_NODES = new Set([
  'CallExpression',
  'NewExpression',
  'AwaitExpression',
  'AssignmentExpression',
  'UpdateExpression',
  'YieldExpression',
  'TaggedTemplateExpression',
  'ImportExpression',
]);

const SUGGESTIBLE_DECLARATION_PARENTS = new Set([
  'Program',
  'BlockStatement',
  'SwitchCase',
]);

function isExportedDefinition(definition: TSESLint.Scope.Definition): boolean {
  const declaration = definition.node.parent;
  const parent = declaration?.parent;
  return (
    parent?.type === 'ExportNamedDeclaration' || parent?.type === 'ExportDefaultDeclaration'
  );
}

function isRestSiblingOmission(definition: TSESLint.Scope.Definition): boolean {
  const declarator = definition.node;
  if (declarator.type !== 'VariableDeclarator') return false;
  const pattern = declarator.id;
  if (pattern.type === 'ObjectPattern') {
    return pattern.properties.some(property => property.type === 'RestElement');
  }
  if (pattern.type === 'ArrayPattern') {
    return pattern.elements.some(element => element?.type === 'RestElement');
  }
  return false;
}

export default createRule({
  name: 'no-dead-code',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    hasSuggestions: true,
    docs: {
      description: 'Disallow unused variables, unused imports and unreachable code (Clean Code G9)',
      cleanCodeId: 'G9',
      cleanCodeRule: 'Dead Code',
    },
    messages: {
      unusedVariable: 'Variable "{{name}}" is never read; delete it (Clean Code G9).',
      unusedImport: 'Import "{{name}}" is never used; delete it (Clean Code G9).',
      unreachableCode: 'This statement is unreachable; delete it (Clean Code G9).',
      removeUnusedVariable: 'Remove the unused variable "{{name}}".',
      removeUnreachableCode: 'Remove the unreachable statement.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreNames: { type: 'array', items: { type: 'string' } },
          ignoreRestSiblings: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ ignoreNames: [] as string[], ignoreRestSiblings: true }],
  create(context, [options]) {
    if (context.filename.endsWith('.d.ts')) return {};
    const sourceCode = context.sourceCode;
    const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
    const ignored = new Set(options.ignoreNames);
    const jsxComponentNames = collectJsxComponentNames(sourceCode.ast, visitorKeys);

    function isUsed(variable: TSESLint.Scope.Variable): boolean {
      if (variable.eslintUsed) return true;
      if (jsxComponentNames.has(variable.name)) return true;
      return variable.references.some(reference => reference.isRead());
    }

    function isSideEffectFree(init: TSESTree.Expression | null): boolean {
      if (!init) return true;
      let clean = true;
      walk(init, visitorKeys, node => {
        if (SIDE_EFFECT_NODES.has(node.type)) {
          clean = false;
          return false;
        }
      });
      return clean;
    }

    function buildImportReplacement(
      importNode: TSESTree.ImportDeclaration,
      removed: TSESTree.Node,
    ): string | null {
      if (importNode.attributes && importNode.attributes.length > 0) return null;
      const remaining = importNode.specifiers.filter(specifier => specifier !== removed);
      const source = sourceCode.getText(importNode.source);
      if (remaining.length === 0) return `import ${source};`;
      const parts: string[] = [];
      const defaultSpecifier = remaining.find(
        specifier => specifier.type === 'ImportDefaultSpecifier',
      );
      const namespaceSpecifier = remaining.find(
        specifier => specifier.type === 'ImportNamespaceSpecifier',
      );
      const namedSpecifiers = remaining.filter(
        specifier => specifier.type === 'ImportSpecifier',
      );
      if (defaultSpecifier) parts.push(sourceCode.getText(defaultSpecifier));
      if (namespaceSpecifier) parts.push(sourceCode.getText(namespaceSpecifier));
      if (namedSpecifiers.length > 0) {
        parts.push(`{ ${namedSpecifiers.map(specifier => sourceCode.getText(specifier)).join(', ')} }`);
      }
      return `import ${parts.join(', ')} from ${source};`;
    }

    function buildDeclaratorRemovalFix(
      declarator: TSESTree.VariableDeclarator,
    ): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null) | null {
      if (declarator.id.type !== 'Identifier') return null;
      const declaration = declarator.parent;
      if (declaration.type !== 'VariableDeclaration') return null;
      if (!SUGGESTIBLE_DECLARATION_PARENTS.has(declaration.parent.type)) return null;
      if (!isSideEffectFree(declarator.init)) return null;
      const remaining = declaration.declarations.filter(item => item !== declarator);
      if (remaining.length === 0) {
        return fixer => fixer.remove(declaration);
      }
      const remainingText = remaining
        .map(item => sourceCode.getText(item))
        .join(', ');
      return fixer => fixer.replaceText(declaration, `${declaration.kind} ${remainingText};`);
    }

    function checkStatements(body: readonly TSESTree.Node[]): void {
      let terminatorIndex = -1;
      for (let index = 0; index < body.length; index++) {
        const statement = body[index];
        if (statement && TERMINATING_STATEMENTS.has(statement.type)) {
          terminatorIndex = index;
          break;
        }
      }
      if (terminatorIndex === -1) return;
      for (let index = terminatorIndex + 1; index < body.length; index++) {
        const statement = body[index];
        if (statement && statement.type !== 'EmptyStatement') {
          context.report({
            node: statement,
            messageId: 'unreachableCode',
            suggest: [
              {
                messageId: 'removeUnreachableCode',
                fix: fixer => fixer.remove(statement),
              },
            ],
          });
          return;
        }
      }
    }

    return {
      Program(node) {
        checkStatements(node.body);
      },
      'Program:exit'() {
        const scopeManager = sourceCode.scopeManager;
        if (!scopeManager) return;
        for (const scope of scopeManager.scopes) {
          for (const variable of scope.variables) {
            const definition = variable.defs[0];
            if (!definition) continue;
            if (definition.type !== 'Variable' && definition.type !== 'ImportBinding') continue;
            if (variable.name.startsWith('_') || ignored.has(variable.name)) continue;
            if (isUsed(variable)) continue;
            if (options.ignoreRestSiblings && isRestSiblingOmission(definition)) continue;
            if (definition.type === 'Variable' && isExportedDefinition(definition)) continue;
            if (definition.type === 'ImportBinding') {
              const specifier = definition.node;
              context.report({
                node: specifier,
                messageId: 'unusedImport',
                data: { name: variable.name },
                fix: (fixer): TSESLint.RuleFix | null => {
                  const importNode = specifier.parent;
                  if (!importNode || importNode.type !== 'ImportDeclaration') return null;
                  const replacement = buildImportReplacement(importNode, specifier);
                  if (replacement === null) return null;
                  return fixer.replaceText(importNode, replacement);
                },
              });
            } else {
              const declarator = definition.node;
              const removalFix =
                declarator.type === 'VariableDeclarator'
                  ? buildDeclaratorRemovalFix(declarator)
                  : null;
              context.report({
                node: definition.name,
                messageId: 'unusedVariable',
                data: { name: variable.name },
                suggest: removalFix
                  ? [
                      {
                        messageId: 'removeUnusedVariable',
                        data: { name: variable.name },
                        fix: removalFix,
                      },
                    ]
                  : undefined,
              });
            }
          }
        }
      },
      BlockStatement(node) {
        checkStatements(node.body);
      },
      SwitchCase(node) {
        checkStatements(node.consequent);
      },
    };
  },
});
