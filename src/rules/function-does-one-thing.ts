import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getFunctionName, isFunctionNode } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';
import { containsWord } from '../utils/naming';

type MessageIds = 'nameSuggestsMultipleThings' | 'functionTooLong';
type Options = { maxStatements: number; maxLines: number }[];
type FunctionLengthContext = TSESLint.RuleContext<MessageIds, Options>;

const MULTI_ACTION_WORDS = ['and', 'or'];

function checkFunctionName(node: FunctionNode, context: FunctionLengthContext): void {
  const name = getFunctionName(node);
  if (!name || !containsWord(name, MULTI_ACTION_WORDS)) return;
  context.report({
    node,
    messageId: 'nameSuggestsMultipleThings',
    data: { name },
  });
}

function checkFunctionLength(
  node: FunctionNode,
  context: FunctionLengthContext,
  options: Options[number],
): void {
  if (node.body.type !== 'BlockStatement') return;
  const body = node.body;
  const statements = body.body.length;
  const lines = body.loc.end.line - body.loc.start.line + 1;
  if (statements <= options.maxStatements && lines <= options.maxLines) return;
  context.report({
    node,
    messageId: 'functionTooLong',
    data: {
      statements,
      maxStatements: options.maxStatements,
      lines,
      maxLines: options.maxLines,
    },
  });
}

function checkFunction(
  node: TSESTree.FunctionLike,
  context: FunctionLengthContext,
  options: Options[number],
): void {
  if (!isFunctionNode(node)) return;
  checkFunctionName(node, context);
  checkFunctionLength(node, context, options);
}

export default createRule({
  name: 'function-does-one-thing',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that functions do one thing and stay short (Clean Code G30)',
      cleanCodeId: 'G30',
      cleanCodeRule: 'Functions Should Do One Thing',
    },
    messages: {
      nameSuggestsMultipleThings:
        'Function "{{name}}" reads as multiple actions; split it into one function per action (Clean Code G30).',
      functionTooLong:
        'Function has {{statements}} statements and {{lines}} lines; keep it within {{maxStatements}} statements and {{maxLines}} lines (Clean Code G30).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxStatements: { type: 'integer', minimum: 1 },
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxStatements: 20, maxLines: 30 }],
  create(context, [options]) {
    return {
      FunctionDeclaration: node => checkFunction(node, context, options),
      FunctionExpression: node => checkFunction(node, context, options),
      ArrowFunctionExpression: node => checkFunction(node, context, options),
    };
  },
});
