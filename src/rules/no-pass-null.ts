import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getCalleeName, getPropertyName, isNullLiteral, unwrap } from '../utils/ast';

type MessageIds = 'nullArgument';
type Options = { ignoreCallees: string[] }[];
type PassNullContext = TSESLint.RuleContext<MessageIds, Options>;

function calleeNameOf(callee: TSESTree.Node): string | undefined {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression') return getPropertyName(callee.property);
  return undefined;
}

function checkArguments(
  args: readonly (TSESTree.Expression | TSESTree.SpreadElement)[],
  name: string | undefined,
  context: PassNullContext,
  ignored: RegExp[],
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

function checkNewExpression(
  node: TSESTree.NewExpression,
  context: PassNullContext,
  ignored: RegExp[],
): void {
  const callee = unwrap(node.callee);
  checkArguments(node.arguments, calleeNameOf(callee), context, ignored);
}

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
    return {
      CallExpression: node =>
        checkArguments(node.arguments, getCalleeName(node.callee), context, ignored),
      NewExpression: node => checkNewExpression(node, context, ignored),
    };
  },
});
