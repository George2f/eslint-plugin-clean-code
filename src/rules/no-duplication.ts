import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'duplicateCode';
type Options = { minStatements: number; minNodes: number }[];

interface SerializedBlock {
  text: string;
  nodeCount: number;
}

interface StoredWindow {
  start: number;
  end: number;
}

function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

function countNodes(children: SerializedBlock[]): number {
  return children.reduce((total, child) => total + child.nodeCount, 1);
}

function serializeChildren(node: TSESTree.Node, visitorKeys: VisitorKeys): SerializedBlock[] {
  const keys = visitorKeys[node.type] ?? [];
  const children: SerializedBlock[] = [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) children.push(serializeNode(item, visitorKeys));
      }
    } else if (isNode(value)) {
      children.push(serializeNode(value, visitorKeys));
    }
  }
  return children;
}

function serializeNode(node: TSESTree.Node, visitorKeys: VisitorKeys): SerializedBlock {
  if (node.type === 'Identifier' || node.type === 'PrivateIdentifier') {
    return { text: '$', nodeCount: 1 };
  }
  if (node.type === 'Literal') return { text: '#', nodeCount: 1 };
  const children = serializeChildren(node, visitorKeys);
  const childTexts = children.map(child => child.text);
  return { text: `${node.type}(${childTexts.join(',')})`, nodeCount: countNodes(children) };
}

function windowSignature(
  window: TSESTree.Node[],
  visitorKeys: VisitorKeys,
  minNodes: number,
): string | undefined {
  const serialized = window.map(statement => serializeNode(statement, visitorKeys));
  if (countNodes(serialized) < minNodes) return undefined;
  const texts = serialized.map(item => item.text);
  return texts.join(';');
}

function overlapsStored(window: TSESTree.Node[], stored: StoredWindow): boolean {
  const first = window[0];
  const last = window.at(-1);
  if (!first || !last) return false;
  return first.range[0] < stored.end && last.range[1] > stored.start;
}

function createBodyChecker(
  context: TSESLint.RuleContext<MessageIds, Options>,
  options: Options[number],
  visitorKeys: VisitorKeys,
): (statements: TSESTree.Node[]) => void {
  const seen = new Map<string, StoredWindow>();
  return statements => {
    for (let index = 0; index + options.minStatements <= statements.length; index += 1) {
      const window = statements.slice(index, index + options.minStatements);
      const signature = windowSignature(window, visitorKeys, options.minNodes);
      if (!signature) continue;
      const stored = seen.get(signature);
      if (!stored) {
        const first = window[0];
        const last = window.at(-1);
        if (first && last) {
          seen.set(signature, { start: first.range[0], end: last.range[1] });
        }
        continue;
      }
      if (overlapsStored(window, stored)) continue;
      context.report({
        node: window[0],
        messageId: 'duplicateCode',
        data: { count: options.minStatements },
      });
      index += options.minStatements - 1;
    }
  };
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
    const checkBody = createBodyChecker(context, options, visitorKeys);
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
