import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getChainRoot, getPropertyName, unwrap } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

type MessageIds = 'emptyTest' | 'todoTest';
type Options = { testFunctions: string[] }[];
type TestContext = TSESLint.RuleContext<MessageIds, Options>;

const EMPTY_TEST_MODIFIERS = ['only', 'each', 'concurrent', 'failing', 'todo'];

function isFrameworkReference(context: TestContext, identifier: TSESTree.Identifier): boolean {
  return !isLocallyBound(getVariable(context.sourceCode, identifier));
}

function isTestFunctionName(name: string, options: Options[number]): boolean {
  return options.testFunctions.includes(name);
}

function todoTestName(
  node: TSESTree.CallExpression,
  context: TestContext,
  options: Options[number],
): string | undefined {
  const callee = unwrap(node.callee);
  if (callee.type !== 'MemberExpression') return undefined;
  if (getPropertyName(callee.property) !== 'todo') return undefined;
  const root = getChainRoot(callee);
  if (root.type !== 'Identifier' || !isTestFunctionName(root.name, options)) return undefined;
  return isFrameworkReference(context, root) ? root.name : undefined;
}

function modifiedTestName(
  callee: TSESTree.MemberExpression,
  context: TestContext,
  options: Options[number],
): string | undefined {
  const property = getPropertyName(callee.property);
  if (property === undefined || !EMPTY_TEST_MODIFIERS.includes(property)) return undefined;
  const root = getChainRoot(callee);
  if (root.type !== 'Identifier' || !isTestFunctionName(root.name, options)) return undefined;
  return isFrameworkReference(context, root) ? root.name : undefined;
}

function emptyTestName(
  node: TSESTree.CallExpression,
  context: TestContext,
  options: Options[number],
): string | undefined {
  const callee = unwrap(node.callee);
  if (callee.type === 'Identifier') {
    if (!isTestFunctionName(callee.name, options)) return undefined;
    return isFrameworkReference(context, callee) ? callee.name : undefined;
  }
  if (callee.type !== 'MemberExpression') return undefined;
  return modifiedTestName(callee, context, options);
}

function hasEmptyBody(node: TSESTree.CallExpression): boolean {
  const last = node.arguments.at(-1);
  if (!last) return false;
  const callback = unwrap(last);
  if (callback.type !== 'FunctionExpression' && callback.type !== 'ArrowFunctionExpression') {
    return false;
  }
  return callback.body.type === 'BlockStatement' && callback.body.body.length === 0;
}

function checkTestCall(
  node: TSESTree.CallExpression,
  context: TestContext,
  options: Options[number],
): void {
  const todoName = todoTestName(node, context, options);
  if (todoName !== undefined) {
    const callee = unwrap(node.callee);
    context.report({ node: callee, messageId: 'todoTest', data: { name: todoName } });
    return;
  }
  const emptyName = emptyTestName(node, context, options);
  if (emptyName === undefined || !hasEmptyBody(node)) return;
  context.report({ node, messageId: 'emptyTest', data: { name: emptyName } });
}

export default createRule({
  name: 'no-todo-tests',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow todo tests and tests with empty bodies (Clean Code T4)',
      cleanCodeId: 'T4',
      cleanCodeRule: 'An Ignored Test Is a Question about an Ambiguity',
    },
    messages: {
      todoTest:
        'Pending test "{{name}}" marks an unanswered question; resolve it or delete the test (Clean Code T4).',
      emptyTest:
        'Test "{{name}}" has an empty body; add an assertion or delete it (Clean Code T4).',
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
  defaultOptions: [{ testFunctions: ['it', 'test', 'specify'] }],
  create(context, [options]) {
    return {
      CallExpression: node => checkTestCall(node, context, options),
    };
  },
});
