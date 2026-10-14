import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type TestHolder =
  | TSESTree.IfStatement
  | TSESTree.WhileStatement
  | TSESTree.DoWhileStatement
  | TSESTree.ConditionalExpression;

export default createRule({
  name: 'no-obscured-intent',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow obscured intent such as nested ternaries, sequence expressions, and assignments in conditions (Clean Code G16)',
      cleanCodeId: 'G16',
      cleanCodeRule: 'Obscured Intent',
    },
    messages: {
      nestedTernary: 'Replace the nested ternary with if/else statements (Clean Code G16).',
      sequenceExpression: 'Split the comma operator into separate statements (Clean Code G16).',
      assignmentInCondition: 'Move the assignment out of the condition (Clean Code G16).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const reported = new WeakSet<TSESTree.Node>();

    function checkTest(node: TestHolder): void {
      const test = node.test;
      walk(
        test,
        visitorKeys,
        current => {
          if (current.type !== 'AssignmentExpression' || reported.has(current)) return;
          reported.add(current);
          context.report({ node: current, messageId: 'assignmentInCondition' });
        },
        {
          shouldDescend: current =>
            current === test ||
            (current.type !== 'FunctionDeclaration' &&
              current.type !== 'FunctionExpression' &&
              current.type !== 'ArrowFunctionExpression'),
        },
      );
    }

    return {
      IfStatement: checkTest,
      WhileStatement: checkTest,
      DoWhileStatement: checkTest,
      ConditionalExpression(node) {
        if (node.parent.type === 'ConditionalExpression') {
          context.report({ node, messageId: 'nestedTernary' });
        }
        checkTest(node);
      },
      SequenceExpression(node) {
        const parent = node.parent;
        if (parent.type === 'ForStatement' && (parent.init === node || parent.update === node)) {
          return;
        }
        context.report({ node, messageId: 'sequenceExpression' });
      },
    };
  },
});
