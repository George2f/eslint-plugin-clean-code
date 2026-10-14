import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { analyzeMutations } from '../utils/functions';
import { walk } from '../utils/ast';
import type { FunctionNode, VisitorKeys } from '../utils/ast';

type MessageIds = 'commandQuerySeparation';
type CommandQueryContext = TSESLint.RuleContext<MessageIds, never[]>;

function isNestedFunctionNode(node: TSESTree.Node): boolean {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function hasValueReturn(body: TSESTree.BlockStatement, visitorKeys: VisitorKeys): boolean {
  let found = false;
  walk(
    body,
    visitorKeys,
    current => {
      if (current.type === 'ReturnStatement' && current.argument) found = true;
    },
    { shouldDescend: current => !isNestedFunctionNode(current) },
  );
  return found;
}

function checkFunction(node: FunctionNode, context: CommandQueryContext): void {
  const body = node.body;
  if (body.type !== 'BlockStatement') return;
  const parent = node.parent;
  if (parent.type === 'MethodDefinition' && parent.kind === 'constructor') return;
  const analysis = analyzeMutations(node, context.sourceCode);
  if (!analysis.mutatesThis && analysis.mutatedOuterVariables.size === 0) return;
  const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
  if (!hasValueReturn(body, visitorKeys)) return;
  context.report({ node, messageId: 'commandQuerySeparation' });
}

export default createRule({
  name: 'command-query-separation',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Separate commands that mutate state from queries that return values (Clean Code Ch3)',
      cleanCodeId: 'Ch3',
      cleanCodeRule: 'Command-Query Separation',
    },
    messages: {
      commandQuerySeparation:
        'Function both mutates state and returns a value; split it into a command and a query (Clean Code Ch3).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      FunctionDeclaration: node => checkFunction(node, context),
      FunctionExpression: node => checkFunction(node, context),
      ArrowFunctionExpression: node => checkFunction(node, context),
    };
  },
});
