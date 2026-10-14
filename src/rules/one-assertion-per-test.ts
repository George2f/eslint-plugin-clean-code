import type { VisitorKeys } from '../utils/ast';
import { createRule } from '../utils/create-rule';
import { getCalleeName, getChainRoot, getPropertyName, unwrap, walk } from '../utils/ast';
import { getVariable, isLocallyBound } from '../utils/scope';

const TEST_MODIFIERS = ['only', 'each', 'concurrent', 'failing'];
const ASSERTION_FUNCTIONS = ['expect', 'assert'];

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
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    return {
      CallExpression(node) {
        const callee = unwrap(node.callee);
        let isTest = false;
        if (callee.type === 'Identifier') {
          isTest =
            options.testFunctions.includes(callee.name) &&
            !isLocallyBound(getVariable(context.sourceCode, callee));
        } else if (callee.type === 'MemberExpression') {
          const property = getPropertyName(callee.property);
          const root = getChainRoot(callee);
          isTest =
            property !== undefined &&
            TEST_MODIFIERS.includes(property) &&
            root.type === 'Identifier' &&
            options.testFunctions.includes(root.name) &&
            !isLocallyBound(getVariable(context.sourceCode, root));
        }
        if (!isTest) return;
        const last = node.arguments[node.arguments.length - 1];
        if (!last) return;
        const callback = unwrap(last);
        if (
          (callback.type !== 'FunctionExpression' &&
            callback.type !== 'ArrowFunctionExpression') ||
          callback.body.type !== 'BlockStatement'
        ) {
          return;
        }
        let count = 0;
        walk(callback.body, visitorKeys, current => {
          if (current.type !== 'CallExpression') return;
          const name = getCalleeName(current.callee);
          if (name !== undefined && ASSERTION_FUNCTIONS.includes(name)) count += 1;
        });
        if (count > options.maxAssertions) {
          context.report({ node, messageId: 'multipleAssertions', data: { count } });
        }
      },
    };
  },
});
