import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

type MessageIds = 'emptyStatement' | 'uselessConstructor' | 'debugger' | 'removeDebugger';
type NoClutterContext = TSESLint.RuleContext<MessageIds, never[]>;

const WRAPPING_PARENT_TYPES = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'LabeledStatement',
  'WithStatement',
]);

function isEmptyConstructor(node: TSESTree.MethodDefinition): boolean {
  const fn = node.value;
  if (!fn.body) return false;
  return fn.body.body.length === 0 && !fn.params.some(param => param.type === 'TSParameterProperty');
}

function isSuperForwardingConstructor(node: TSESTree.MethodDefinition): boolean {
  const fn = node.value;
  if (!fn.body || fn.body.body.length !== 1) return false;
  const statement = fn.body.body[0];
  if (statement.type !== 'ExpressionStatement') return false;
  const expression = statement.expression;
  if (expression.type !== 'CallExpression' || expression.callee.type !== 'Super') return false;
  if (expression.arguments.length !== 1) return false;
  const argument = expression.arguments[0];
  if (argument.type !== 'SpreadElement' || argument.argument.type !== 'Identifier') return false;
  return fn.params.length === 1 && fn.params[0].type === 'RestElement';
}

function classHasSuperClass(node: TSESTree.MethodDefinition): boolean {
  const classBody = node.parent;
  const classNode = classBody.parent;
  return (
    (classNode.type === 'ClassDeclaration' || classNode.type === 'ClassExpression') &&
    classNode.superClass !== null
  );
}

function replacementForEmptyStatement(
  node: TSESTree.EmptyStatement,
  sourceCode: TSESLint.SourceCode,
): string | undefined {
  const parent = node.parent;
  if (!parent || !WRAPPING_PARENT_TYPES.has(parent.type)) return undefined;
  const previous = sourceCode.getTokenBefore(node);
  const needsSpace = !previous || previous.range[1] === node.range[0];
  return needsSpace ? ' {}' : '{}';
}

function reportEmptyStatement(node: TSESTree.EmptyStatement, context: NoClutterContext): void {
  const sourceCode = context.sourceCode;
  context.report({
    node,
    messageId: 'emptyStatement',
    fix: fixer => {
      const replacement = replacementForEmptyStatement(node, sourceCode);
      return replacement === undefined
        ? fixer.remove(node)
        : fixer.replaceText(node, replacement);
    },
  });
}

function reportUselessConstructor(
  node: TSESTree.MethodDefinition,
  context: NoClutterContext,
): void {
  if (node.kind !== 'constructor') return;
  const empty = isEmptyConstructor(node);
  const forwarding = isSuperForwardingConstructor(node);
  if (!empty && !forwarding) return;
  const canRemove = forwarding || (!classHasSuperClass(node) && node.decorators.length === 0);
  context.report({
    node,
    messageId: 'uselessConstructor',
    fix: canRemove ? fixer => fixer.remove(node) : undefined,
  });
}

function reportDebuggerStatement(
  node: TSESTree.DebuggerStatement,
  context: NoClutterContext,
): void {
  context.report({
    node,
    messageId: 'debugger',
    suggest: [
      {
        messageId: 'removeDebugger',
        fix: fixer => fixer.remove(node),
      },
    ],
  });
}

export default createRule({
  name: 'no-clutter',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    hasSuggestions: true,
    docs: {
      description:
        'Disallow clutter such as empty statements, useless constructors, and debugger statements (Clean Code G12)',
      cleanCodeId: 'G12',
      cleanCodeRule: 'Clutter',
    },
    messages: {
      emptyStatement: 'Remove the empty statement; it is clutter (Clean Code G12).',
      uselessConstructor:
        'Remove the useless constructor; it adds nothing and forces manual maintenance (Clean Code G12).',
      debugger: 'Remove the debugger statement; it is clutter left behind (Clean Code G12).',
      removeDebugger: 'Remove the debugger statement.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      EmptyStatement: node => reportEmptyStatement(node, context),
      MethodDefinition: node => reportUselessConstructor(node, context),
      DebuggerStatement: node => reportDebuggerStatement(node, context),
    };
  },
});
