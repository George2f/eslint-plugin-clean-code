import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type MessageIds = 'featureEnvy';
type Options = { minimumAccesses: number }[];
type FeatureEnvyContext = TSESLint.RuleContext<MessageIds, Options>;

interface AccessCounts {
  ownAccesses: number;
  objectAccesses: Map<string, number>;
}

interface TopAccess {
  name: string;
  count: number;
}

function isMethod(node: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression): boolean {
  const parent = node.parent;
  if (parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') return true;
  return (
    parent.type === 'Property' &&
    parent.value === node &&
    parent.parent.type === 'ObjectExpression'
  );
}

function isNestedFunction(node: TSESTree.Node): boolean {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function countAccesses(
  body: TSESTree.Node,
  visitorKeys: VisitorKeys,
): AccessCounts {
  const counts: AccessCounts = { ownAccesses: 0, objectAccesses: new Map() };
  walk(
    body,
    visitorKeys,
    current => {
      if (current.type !== 'MemberExpression') return;
      const object = current.object;
      if (object.type === 'ThisExpression') {
        counts.ownAccesses += 1;
        return;
      }
      if (object.type === 'Identifier') {
        const count = counts.objectAccesses.get(object.name) ?? 0;
        counts.objectAccesses.set(object.name, count + 1);
      }
    },
    { shouldDescend: current => !isNestedFunction(current) },
  );
  return counts;
}

function findTopAccess(objectAccesses: Map<string, number>): TopAccess | undefined {
  let top: TopAccess | undefined;
  for (const [name, count] of objectAccesses) {
    if (!top || count > top.count) top = { name, count };
  }
  return top;
}

function checkMethodFunction(
  node: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
  context: FeatureEnvyContext,
  options: Options[number],
): void {
  if (!isMethod(node)) return;
  const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
  const counts = countAccesses(node.body, visitorKeys);
  const top = findTopAccess(counts.objectAccesses);
  if (!top) return;
  if (top.count < options.minimumAccesses || top.count <= counts.ownAccesses) return;
  context.report({
    node,
    messageId: 'featureEnvy',
    data: { object: top.name, accesses: top.count, ownAccesses: counts.ownAccesses },
  });
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
    return {
      FunctionExpression: node => checkMethodFunction(node, context, options),
      ArrowFunctionExpression: node => checkMethodFunction(node, context, options),
    };
  },
});
