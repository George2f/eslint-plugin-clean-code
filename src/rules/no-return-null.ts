import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { FunctionNode } from '../utils/ast';
import { createRule } from '../utils/create-rule';
import { isFunctionNode, isNullLiteral } from '../utils/ast';

type MessageIds = 'returnNull';
type Options = { allowNullableReturnType: boolean }[];
type ReturnNullContext = TSESLint.RuleContext<MessageIds, Options>;

function hasNullableReturnType(
  fn: FunctionNode,
  sourceCode: TSESLint.SourceCode,
  options: Options[number],
): boolean {
  if (!options.allowNullableReturnType || !fn.returnType) return false;
  return /null|undefined/.test(sourceCode.getText(fn.returnType.typeAnnotation));
}

function findEnclosingFunction(node: TSESTree.Node): FunctionNode | null {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (isFunctionNode(current)) return current;
    current = current.parent;
  }
  return null;
}

function checkReturnStatement(
  node: TSESTree.ReturnStatement,
  context: ReturnNullContext,
  options: Options[number],
): void {
  if (!node.argument || !isNullLiteral(node.argument)) return;
  const enclosing = findEnclosingFunction(node);
  if (enclosing && hasNullableReturnType(enclosing, context.sourceCode, options)) return;
  context.report({ node, messageId: 'returnNull' });
}

function checkArrowFunction(
  node: TSESTree.ArrowFunctionExpression,
  context: ReturnNullContext,
  options: Options[number],
): void {
  if (node.body.type === 'BlockStatement' || !isNullLiteral(node.body)) return;
  if (hasNullableReturnType(node, context.sourceCode, options)) return;
  context.report({ node: node.body, messageId: 'returnNull' });
}

export default createRule({
  name: 'no-return-null',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow returning null; return an empty value or throw (Clean Code Ch7)',
      cleanCodeId: 'Ch7',
      cleanCodeRule: "Don't Return Null",
    },
    messages: {
      returnNull:
        'Do not return null; return an empty value, a special case, or throw an exception (Clean Code Ch7).',
    },
    schema: [
      {
        type: 'object',
        properties: { allowNullableReturnType: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowNullableReturnType: true }],
  create(context, [options]) {
    return {
      ReturnStatement: node => checkReturnStatement(node, context, options),
      ArrowFunctionExpression: node => checkArrowFunction(node, context, options),
    };
  },
});
