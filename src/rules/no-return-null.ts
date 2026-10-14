import type { TSESTree } from '@typescript-eslint/utils';
import type { FunctionNode } from '../utils/ast';
import { createRule } from '../utils/create-rule';
import { isFunctionNode, isNullLiteral } from '../utils/ast';

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
    const sourceCode = context.sourceCode;

    function hasNullableReturnType(fn: FunctionNode): boolean {
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

    return {
      ReturnStatement(node) {
        if (!node.argument || !isNullLiteral(node.argument)) return;
        const enclosing = findEnclosingFunction(node);
        if (enclosing && hasNullableReturnType(enclosing)) return;
        context.report({ node, messageId: 'returnNull' });
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === 'BlockStatement' || !isNullLiteral(node.body)) return;
        if (hasNullableReturnType(node)) return;
        context.report({ node: node.body, messageId: 'returnNull' });
      },
    };
  },
});
