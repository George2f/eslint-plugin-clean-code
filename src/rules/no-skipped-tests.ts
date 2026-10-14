import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getChainRoot, getPropertyName, unwrap } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

type MessageIds = 'skippedTest' | 'unskipTest';
type Options = { testFunctions: string[] }[];
type SkippedTestContext = TSESLint.RuleContext<MessageIds, Options>;

const SKIPPED_TEST_PREFIX = /^x(?:it|test|describe|specify|context)$/;

function isFrameworkReference(context: SkippedTestContext, identifier: TSESTree.Identifier): boolean {
  return !isLocallyBound(getVariable(context.sourceCode, identifier));
}

function reportSkippedIdentifier(
  context: SkippedTestContext,
  callee: TSESTree.Identifier,
): void {
  context.report({
    node: callee,
    messageId: 'skippedTest',
    data: { name: callee.name },
    suggest: [
      {
        messageId: 'unskipTest',
        fix: fixer => fixer.replaceText(callee, callee.name.slice(1)),
      },
    ],
  });
}

function reportSkippedMember(
  context: SkippedTestContext,
  member: TSESTree.MemberExpression,
  root: TSESTree.Identifier,
): void {
  context.report({
    node: member,
    messageId: 'skippedTest',
    data: { name: root.name },
    suggest: [
      {
        messageId: 'unskipTest',
        fix: fixer =>
          fixer.removeRange([member.object.range[1], member.property.range[1]]),
      },
    ],
  });
}

function checkSkipRoot(
  member: TSESTree.MemberExpression,
  context: SkippedTestContext,
  options: Options[number],
): void {
  const root = getChainRoot(member);
  if (root.type !== 'Identifier' || !options.testFunctions.includes(root.name)) return;
  if (!isFrameworkReference(context, root)) return;
  reportSkippedMember(context, member, root);
}

function scanMemberChain(
  callee: TSESTree.MemberExpression,
  context: SkippedTestContext,
  options: Options[number],
): void {
  let current: TSESTree.Node = callee;
  while (current.type === 'MemberExpression') {
    if (getPropertyName(current.property) === 'skip') {
      checkSkipRoot(current, context, options);
    }
    current = current.object;
  }
}

function checkSkippedCall(
  node: TSESTree.CallExpression,
  context: SkippedTestContext,
  options: Options[number],
): void {
  const callee = unwrap(node.callee);
  if (callee.type === 'Identifier') {
    if (SKIPPED_TEST_PREFIX.test(callee.name) && isFrameworkReference(context, callee)) {
      reportSkippedIdentifier(context, callee);
    }
    return;
  }
  if (callee.type !== 'MemberExpression') return;
  scanMemberChain(callee, context, options);
}

export default createRule({
  name: 'no-skipped-tests',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow skipped tests (Clean Code T3)',
      cleanCodeId: 'T3',
      cleanCodeRule: "Don't Skip Trivial Tests",
    },
    messages: {
      skippedTest:
        'Skipped test "{{name}}" hides broken behavior; make it pass or delete it (Clean Code T3).',
      unskipTest: 'Un-skip the test.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          testFunctions: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ testFunctions: ['it', 'test', 'describe', 'context', 'suite', 'specify'] }],
  create(context, [options]) {
    return {
      CallExpression: node => checkSkippedCall(node, context, options),
    };
  },
});
