import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

function isMethod(node: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression): boolean {
  const parent = node.parent;
  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') return true;
  return (
    parent.type === 'Property' &&
    parent.value === node &&
    parent.parent.type === 'ObjectExpression'
  );
}

export default createRule({
  name: 'no-feature-envy',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow methods that access another object more than their own state (Clean Code G14)',
      cleanCodeId: 'G14',
      cleanCodeRule: 'Feature Envy',
    },
    messages: {
      featureEnvy:
        'Method accesses {{object}} {{accesses}} times but its own state only {{ownAccesses}} times; move it closer to {{object}} (Clean Code G14).',
    },
    schema: [
      {
        type: 'object',
        properties: { minimumAccesses: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minimumAccesses: 4 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    function check(node: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression): void {
      if (!isMethod(node)) return;
      let ownAccesses = 0;
      const objectAccesses = new Map<string, number>();
      walk(
        node.body,
        visitorKeys,
        current => {
          if (current.type !== 'MemberExpression') return;
          const object = current.object;
          if (object.type === 'ThisExpression') {
            ownAccesses += 1;
            return;
          }
          if (object.type === 'Identifier') {
            objectAccesses.set(object.name, (objectAccesses.get(object.name) ?? 0) + 1);
          }
        },
        {
          shouldDescend: current =>
            current.type !== 'FunctionDeclaration' && current.type !== 'FunctionExpression',
        },
      );
      let maxName: string | undefined;
      let maxCount = 0;
      for (const [name, count] of objectAccesses) {
        if (count > maxCount) {
          maxName = name;
          maxCount = count;
        }
      }
      if (maxName === undefined) return;
      if (maxCount < options.minimumAccesses || maxCount <= ownAccesses) return;
      context.report({
        node,
        messageId: 'featureEnvy',
        data: { object: maxName, accesses: maxCount, ownAccesses },
      });
    }

    return {
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
