import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getCalleeName, getPropertyName, isNullLiteral, unwrap } from '../utils/ast';

export default createRule({
  name: 'no-pass-null',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow passing null as a function argument (Clean Code Ch7)',
      cleanCodeId: 'Ch7',
      cleanCodeRule: "Don't Pass Null",
    },
    messages: {
      nullArgument:
        'Do not pass null to "{{callee}}"; pass a meaningful value or drop the argument (Clean Code Ch7).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoreCallees: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ ignoreCallees: ['^use[A-Z]'] }],
  create(context, [options]) {
    const ignored = options.ignoreCallees.map(source => new RegExp(source));

    function checkArguments(
      args: readonly (TSESTree.Expression | TSESTree.SpreadElement)[],
      name: string | undefined,
    ): void {
      for (const argument of args) {
        if (!isNullLiteral(argument)) continue;
        if (name !== undefined && ignored.some(pattern => pattern.test(name))) continue;
        context.report({
          node: argument,
          messageId: 'nullArgument',
          data: { callee: name ?? '(anonymous)' },
        });
      }
    }

    return {
      CallExpression(node) {
        checkArguments(node.arguments, getCalleeName(node.callee));
      },
      NewExpression(node) {
        const callee = unwrap(node.callee);
        if (callee.type === 'Identifier') {
          checkArguments(node.arguments, callee.name);
        } else if (callee.type === 'MemberExpression') {
          checkArguments(node.arguments, getPropertyName(callee.property));
        } else {
          checkArguments(node.arguments, undefined);
        }
      },
    };
  },
});
