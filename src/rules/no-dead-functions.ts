import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { collectJsxComponentNames, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { getVariable } from '../utils/scope';

type MessageIds = 'deadFunction' | 'removeDeadFunction';
type Options = { allow: string[] }[];
type DeadFunctionContext = TSESLint.RuleContext<MessageIds, Options>;

interface DeadFunctionState {
  sourceCode: TSESLint.SourceCode;
  allowed: Set<string>;
  jsxComponentNames: Set<string>;
  privateNameCounts: Map<string, number>;
}

function isExportDeclaration(node: TSESTree.Node | undefined): boolean {
  return node?.type === 'ExportNamedDeclaration' || node?.type === 'ExportDefaultDeclaration';
}

const SUGGESTIBLE_DECLARATION_PARENTS = new Set([
  'Program',
  'BlockStatement',
  'SwitchCase',
]);

function isUsed(variable: TSESLint.Scope.Variable, jsxComponentNames: Set<string>): boolean {
  if (variable.eslintUsed) return true;
  if (jsxComponentNames.has(variable.name)) return true;
  return variable.references.some(reference => reference.isRead());
}

function buildDeclaratorRemovalFix(
  declarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
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

function checkFunctionDeclaration(
  node: TSESTree.FunctionDeclaration,
  context: DeadFunctionContext,
  state: DeadFunctionState,
): void {
  const identifier = node.id;
  if (!identifier || state.allowed.has(identifier.name)) return;
  if (isExportDeclaration(node.parent)) return;
  const variable = getVariable(state.sourceCode, identifier);
  if (!variable || isUsed(variable, state.jsxComponentNames)) return;
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

function checkVariableDeclarator(
  node: TSESTree.VariableDeclarator,
  context: DeadFunctionContext,
  state: DeadFunctionState,
): void {
  const init = node.init;
  if (!init) return;
  if (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression') return;
  if (node.id.type !== 'Identifier' || state.allowed.has(node.id.name)) return;
  if (isExportDeclaration(node.parent.parent)) return;
  const identifier = node.id;
  const variable = getVariable(state.sourceCode, identifier);
  if (!variable || isUsed(variable, state.jsxComponentNames)) return;
  const removalFix = buildDeclaratorRemovalFix(node, state.sourceCode);
  context.report({
    node: identifier,
    messageId: 'deadFunction',
    data: { name: identifier.name },
    suggest: removalFix
      ? [
          {
            messageId: 'removeDeadFunction',
            data: { name: identifier.name },
            fix: removalFix,
          },
        ]
      : undefined,
  });
}

function checkPrivateMethod(
  node: TSESTree.MethodDefinition,
  context: DeadFunctionContext,
  state: DeadFunctionState,
): void {
  if (node.key.type !== 'PrivateIdentifier') return;
  if (state.allowed.has(node.key.name)) return;
  if (state.privateNameCounts.get(node.key.name) !== 1) return;
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

function collectPrivateNames(
  node: TSESTree.Program,
  visitorKeys: VisitorKeys,
): Map<string, number> {
  const privateNameCounts = new Map<string, number>();
  walk(node, visitorKeys, current => {
    if (current.type !== 'PrivateIdentifier') return;
    const count = privateNameCounts.get(current.name) ?? 0;
    privateNameCounts.set(current.name, count + 1);
  });
  return privateNameCounts;
}

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
    const state: DeadFunctionState = {
      sourceCode,
      allowed: new Set(options.allow),
      jsxComponentNames: collectJsxComponentNames(sourceCode.ast, visitorKeys),
      privateNameCounts: new Map(),
    };
    return {
      Program(node) {
        state.privateNameCounts = collectPrivateNames(node, visitorKeys);
      },
      FunctionDeclaration: node => checkFunctionDeclaration(node, context, state),
      VariableDeclarator: node => checkVariableDeclarator(node, context, state),
      MethodDefinition: node => checkPrivateMethod(node, context, state),
    };
  },
});
