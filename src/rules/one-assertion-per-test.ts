import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getCalleeName, getChainRoot, getPropertyName, unwrap, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

type MessageIds = 'multipleAssertions';
type Options = { maxAssertions: number; testFunctions: string[] }[];
type AssertionContext = TSESLint.RuleContext<MessageIds, Options>;

const TEST_MODIFIERS = ['only', 'each', 'concurrent', 'failing'];
const ASSERTION_FUNCTIONS = ['expect', 'assert'];

function isFrameworkReference(context: AssertionContext, identifier: TSESTree.Identifier): boolean {
  return !isLocallyBound(getVariable(context.sourceCode, identifier));
}

function isTestCallee(
  callee: TSESTree.Node,
  context: AssertionContext,
  options: Options[number],
): boolean {
  if (callee.type === 'Identifier') {
    return (
      options.testFunctions.includes(callee.name) &&
      isFrameworkReference(context, callee)
    );
  }
  if (callee.type !== 'MemberExpression') return false;
  const property = getPropertyName(callee.property);
  const root = getChainRoot(callee);
  if (property === undefined || !TEST_MODIFIERS.includes(property)) return false;
  if (root.type !== 'Identifier' || !options.testFunctions.includes(root.name)) return false;
  return isFrameworkReference(context, root);
}

function isTestCall(
  node: TSESTree.CallExpression,
  context: AssertionContext,
  options: Options[number],
): boolean {
  return isTestCallee(unwrap(node.callee), context, options);
}

function callbackBodyOf(node: TSESTree.CallExpression): TSESTree.BlockStatement | undefined {
  const last = node.arguments.at(-1);
  if (!last) return undefined;
  const callback = unwrap(last);
  if (callback.type !== 'FunctionExpression' && callback.type !== 'ArrowFunctionExpression') {
    return undefined;
  }
  const body = callback.body;
  return body.type === 'BlockStatement' ? body : undefined;
}

function countAssertions(body: TSESTree.BlockStatement, sourceCode: TSESLint.SourceCode): number {
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  let count = 0;
  walk(body, visitorKeys, current => {
    if (current.type !== 'CallExpression') return;
    const name = getCalleeName(current.callee);
    if (name !== undefined && ASSERTION_FUNCTIONS.includes(name)) count += 1;
  });
  return count;
}

function checkTestCall(
  node: TSESTree.CallExpression,
  context: AssertionContext,
  options: Options[number],
): void {
  if (!isTestCall(node, context, options)) return;
  const body = callbackBodyOf(node);
  if (!body) return;
  const count = countAssertions(body, context.sourceCode);
  if (count <= options.maxAssertions) return;
  context.report({ node, messageId: 'multipleAssertions', data: { count } });
}

export default createRule({
  name: 'one-assertion-per-test',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a single assertion per test (Clean Code Ch9)',
      cleanCodeId: 'Ch9',
      cleanCodeRule: 'One Assert per Test',
    },
    messages: {
      multipleAssertions:
        'Test has {{count}} assertions; keep one assertion per test (Clean Code Ch9).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxAssertions: { type: 'integer', minimum: 0 },
          testFunctions: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxAssertions: 1, testFunctions: ['it', 'test'] }],
  create(context, [options]) {
    return {
      CallExpression: node => checkTestCall(node, context, options),
    };
  },
});
