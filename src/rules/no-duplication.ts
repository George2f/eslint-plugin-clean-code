import type { TSESTree } from '@typescript-eslint/utils';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

function serialize(
  node: TSESTree.Node,
  visitorKeys: VisitorKeys,
  counter: { nodes: number },
): string {
  counter.nodes += 1;
  if (node.type === 'Identifier' || node.type === 'PrivateIdentifier') return '$';
  if (node.type === 'Literal') return '#';
  const keys = visitorKeys[node.type] ?? [];
  const parts: string[] = [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) parts.push(serialize(item, visitorKeys, counter));
      }
    } else if (isNode(value)) {
      parts.push(serialize(value, visitorKeys, counter));
    }
  }
  return node.type + '(' + parts.join(',') + ')';
}

export default createRule({
  name: 'no-duplication',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow duplicated blocks of statements (Clean Code G5)',
      cleanCodeId: 'G5',
      cleanCodeRule: 'Duplication',
    },
    messages: {
      duplicateCode:
        'This block duplicates an earlier block of {{count}} statements. Extract the shared logic into one function (Clean Code G5).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minStatements: { type: 'integer', minimum: 2 },
          minNodes: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minStatements: 4, minNodes: 25 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const bodies: TSESTree.Node[][] = [];
    const seen = new Map<string, { start: number; end: number }>();
    function checkBody(statements: TSESTree.Node[]): void {
      for (let index = 0; index + options.minStatements <= statements.length; index += 1) {
        const window = statements.slice(index, index + options.minStatements);
        const counter = { nodes: 0 };
        const signature = window
          .map(statement => serialize(statement, visitorKeys, counter))
          .join(';');
        if (counter.nodes < options.minNodes) continue;
        const stored = seen.get(signature);
        if (!stored) {
          seen.set(signature, {
            start: window[0].range[0],
            end: window[window.length - 1].range[1],
          });
          continue;
        }
        const first = window[0];
        const last = window[window.length - 1];
        const overlaps = first.range[0] < stored.end && last.range[1] > stored.start;
        if (!overlaps) {
          context.report({
            node: first,
            messageId: 'duplicateCode',
            data: { count: options.minStatements },
          });
          index += options.minStatements - 1;
        }
      }
    }
    return {
      Program(node) {
        bodies.push(node.body);
      },
      BlockStatement(node) {
        bodies.push(node.body);
      },
      SwitchCase(node) {
        bodies.push(node.consequent);
      },
      'Program:exit'() {
        for (const body of bodies) checkBody(body);
      },
    };
  },
});
