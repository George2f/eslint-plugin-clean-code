import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type MessageIds = 'nestedTernary' | 'sequenceExpression' | 'assignmentInCondition';
type ObscuredIntentContext = TSESLint.RuleContext<MessageIds, never[]>;

type TestHolder =
  | TSESTree.IfStatement
  | TSESTree.WhileStatement
  | TSESTree.DoWhileStatement
  | TSESTree.ConditionalExpression;

function isFunctionBoundary(node: TSESTree.Node): boolean {
  if (node.type === 'FunctionDeclaration') return true;
  if (node.type === 'FunctionExpression') return true;
  return node.type === 'ArrowFunctionExpression';
}

function shouldEnterTest(current: TSESTree.Node, test: TSESTree.Node): boolean {
  if (current === test) return true;
  return !isFunctionBoundary(current);
}

function createTestChecker(
  context: ObscuredIntentContext,
  visitorKeys: VisitorKeys,
): (node: TestHolder) => void {
  const reported = new WeakSet<TSESTree.Node>();
  return node => {
    const test = node.test;
    walk(
      test,
      visitorKeys,
      current => {
        if (current.type !== 'AssignmentExpression') return;
        if (reported.has(current)) return;
        reported.add(current);
        context.report({ node: current, messageId: 'assignmentInCondition' });
      },
      { shouldDescend: current => shouldEnterTest(current, test) },
    );
  };
}

function reportSequenceExpression(
  node: TSESTree.SequenceExpression,
  context: ObscuredIntentContext,
): void {
  const parent = node.parent;
  if (parent.type === 'ForStatement' && (parent.init === node || parent.update === node)) {
    return;
  }
  context.report({ node, messageId: 'sequenceExpression' });
}

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
    const checkTest = createTestChecker(context, visitorKeys);
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
      SequenceExpression: node => reportSequenceExpression(node, context),
    };
  },
});
