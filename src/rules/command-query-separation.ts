import { createRule } from '../utils/create-rule';
import { analyzeMutations } from '../utils/functions';
import { walk } from '../utils/ast';
import type { FunctionNode, VisitorKeys } from '../utils/ast';

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
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;

    function hasValueReturn(node: FunctionNode): boolean {
      let found = false;
      walk(
        node.body,
        visitorKeys,
        current => {
          if (current.type === 'ReturnStatement' && current.argument) {
            found = true;
          }
        },
        {
          shouldDescend: current =>
            current.type !== 'FunctionDeclaration' && current.type !== 'FunctionExpression',
        },
      );
      return found;
    }

    function check(node: FunctionNode): void {
      if (node.body.type !== 'BlockStatement') return;
      const parent = node.parent;
      if (parent.type === 'MethodDefinition' && parent.kind === 'constructor') return;
      const analysis = analyzeMutations(node, context.sourceCode);
      if (!analysis.mutatesThis && analysis.mutatedOuterVariables.size === 0) return;
      if (hasValueReturn(node)) {
        context.report({ node, messageId: 'commandQuerySeparation' });
      }
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
