import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { collectJsxComponentNames, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds =
  | 'unusedVariable'
  | 'unusedImport'
  | 'unreachableCode'
  | 'removeUnusedVariable'
  | 'removeUnreachableCode';
type Options = { ignoreNames: string[]; ignoreRestSiblings: boolean }[];
type DeadCodeContext = TSESLint.RuleContext<MessageIds, Options>;

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

interface DeadCodeDeps {
  ignoredNames: Set<string>;
  jsxComponentNames: Set<string>;
}

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

function isUsed(variable: TSESLint.Scope.Variable, deps: DeadCodeDeps): boolean {
  if (variable.eslintUsed) return true;
  if (deps.jsxComponentNames.has(variable.name)) return true;
  return variable.references.some(reference => reference.isRead());
}

function isSideEffectFree(init: TSESTree.Expression | null, visitorKeys: VisitorKeys): boolean {
  if (!init) return true;
  let clean = true;
  walk(init, visitorKeys, node => {
    if (SIDE_EFFECT_NODES.has(node.type)) clean = false;
  });
  return clean;
}

function joinNamedSpecifiers(
  namedSpecifiers: readonly TSESTree.ImportClause[],
  sourceCode: TSESLint.SourceCode,
): string {
  const texts = namedSpecifiers.map(specifier => sourceCode.getText(specifier));
  return `{ ${texts.join(', ')} }`;
}

function buildImportParts(
  remaining: readonly TSESTree.ImportClause[],
  sourceCode: TSESLint.SourceCode,
): string[] {
  const defaultSpecifier = remaining.find(
    specifier => specifier.type === 'ImportDefaultSpecifier',
  );
  const namespaceSpecifier = remaining.find(
    specifier => specifier.type === 'ImportNamespaceSpecifier',
  );
  const namedSpecifiers = remaining.filter(
    specifier => specifier.type === 'ImportSpecifier',
  );
  const parts: string[] = [];
  for (const specifier of [defaultSpecifier, namespaceSpecifier]) {
    if (specifier) parts.push(sourceCode.getText(specifier));
  }
  if (namedSpecifiers.length > 0) {
    parts.push(joinNamedSpecifiers(namedSpecifiers, sourceCode));
  }
  return parts;
}

function buildImportReplacement(
  importNode: TSESTree.ImportDeclaration,
  removed: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): string | null {
  if (importNode.attributes && importNode.attributes.length > 0) return null;
  const source = sourceCode.getText(importNode.source);
  const remaining = importNode.specifiers.filter(specifier => specifier !== removed);
  if (remaining.length === 0) return `import ${source};`;
  const parts = buildImportParts(remaining, sourceCode);
  return `import ${parts.join(', ')} from ${source};`;
}

function buildDeclaratorRemovalFix(
  declarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null) | null {
  if (declarator.id.type !== 'Identifier') return null;
  const declaration = declarator.parent;
  if (declaration.type !== 'VariableDeclaration') return null;
  if (!SUGGESTIBLE_DECLARATION_PARENTS.has(declaration.parent.type)) return null;
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  if (!isSideEffectFree(declarator.init, visitorKeys)) return null;
  const remaining = declaration.declarations.filter(item => item !== declarator);
  if (remaining.length === 0) {
    return fixer => fixer.remove(declaration);
  }
  const remainingText = remaining
    .map(item => sourceCode.getText(item))
    .join(', ');
  return fixer => fixer.replaceText(declaration, `${declaration.kind} ${remainingText};`);
}

function reportUnusedImport(
  variable: TSESLint.Scope.Variable,
  definition: TSESLint.Scope.Definition,
  context: DeadCodeContext,
): void {
  const specifier = definition.node;
  const sourceCode = context.sourceCode;
  context.report({
    node: specifier,
    messageId: 'unusedImport',
    data: { name: variable.name },
    fix: (fixer): TSESLint.RuleFix | null => {
      const importNode = specifier.parent;
      if (!importNode || importNode.type !== 'ImportDeclaration') return null;
      const replacement = buildImportReplacement(importNode, specifier, sourceCode);
      if (replacement === null) return null;
      return fixer.replaceText(importNode, replacement);
    },
  });
}

function reportUnusedDeclaration(
  variable: TSESLint.Scope.Variable,
  definition: TSESLint.Scope.Definition,
  context: DeadCodeContext,
): void {
  const declarator = definition.node;
  const removalFix =
    declarator.type === 'VariableDeclarator'
      ? buildDeclaratorRemovalFix(declarator, context.sourceCode)
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

function checkVariable(
  variable: TSESLint.Scope.Variable,
  context: DeadCodeContext,
  options: Options[number],
  deps: DeadCodeDeps,
): void {
  const definition = variable.defs[0];
  if (!definition) return;
  if (definition.type !== 'Variable' && definition.type !== 'ImportBinding') return;
  if (variable.name.startsWith('_') || deps.ignoredNames.has(variable.name)) return;
  if (isUsed(variable, deps)) return;
  if (options.ignoreRestSiblings && isRestSiblingOmission(definition)) return;
  if (definition.type === 'Variable' && isExportedDefinition(definition)) return;
  if (definition.type === 'ImportBinding') {
    reportUnusedImport(variable, definition, context);
    return;
  }
  reportUnusedDeclaration(variable, definition, context);
}

function reportUnusedVariables(
  context: DeadCodeContext,
  options: Options[number],
  visitorKeys: VisitorKeys,
): void {
  const scopeManager = context.sourceCode.scopeManager;
  if (!scopeManager) return;
  const deps: DeadCodeDeps = {
    ignoredNames: new Set(options.ignoreNames),
    jsxComponentNames: collectJsxComponentNames(context.sourceCode.ast, visitorKeys),
  };
  for (const scope of scopeManager.scopes) {
    for (const variable of scope.variables) {
      checkVariable(variable, context, options, deps);
    }
  }
}

function findUnreachableStatement(
  body: readonly TSESTree.Node[],
  terminatorIndex: number,
): TSESTree.Node | undefined {
  const afterTerminator = body.slice(terminatorIndex + 1);
  return afterTerminator.find(statement => statement.type !== 'EmptyStatement');
}

function checkStatements(body: readonly TSESTree.Node[], context: DeadCodeContext): void {
  const terminatorIndex = body.findIndex(statement =>
    TERMINATING_STATEMENTS.has(statement.type),
  );
  if (terminatorIndex === -1) return;
  const unreachable = findUnreachableStatement(body, terminatorIndex);
  if (!unreachable) return;
  context.report({
    node: unreachable,
    messageId: 'unreachableCode',
    suggest: [
      {
        messageId: 'removeUnreachableCode',
        fix: fixer => fixer.remove(unreachable),
      },
    ],
  });
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
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    return {
      Program(node) {
        checkStatements(node.body, context);
      },
      'Program:exit'() {
        reportUnusedVariables(context, options, visitorKeys);
      },
      BlockStatement(node) {
        checkStatements(node.body, context);
      },
      SwitchCase(node) {
        checkStatements(node.consequent, context);
      },
    };
  },
});
