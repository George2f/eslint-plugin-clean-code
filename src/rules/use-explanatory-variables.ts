import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

const SKIPPED_ARGUMENT_TYPES = new Set([
  'ObjectExpression',
  'ArrayExpression',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'Literal',
  'TemplateLiteral',
  'TaggedTemplateExpression',
]);

type TestHolder =
  | TSESTree.IfStatement
  | TSESTree.WhileStatement
  | TSESTree.DoWhileStatement
  | TSESTree.ConditionalExpression;

export default createRule({
  name: 'use-explanatory-variables',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require complex lookups in conditions and call arguments to be assigned to explanatory variables (Clean Code G19)',
      cleanCodeId: 'G19',
      cleanCodeRule: 'Use Explanatory Variables',
    },
    messages: {
      extractVariable:
        'This expression contains {{count}} complex lookup(s); assign them to explanatory variables (Clean Code G19).',
    },
    schema: [
      {
        type: 'object',
        properties: { minComplexLookups: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minComplexLookups: 1 }],
  create(context, [options]) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const reportedRanges: TSESTree.Range[] = [];

    function isComplexLookup(node: TSESTree.Node): boolean {
      if (node.type !== 'CallExpression' && !(node.type === 'MemberExpression' && node.computed)) {
        return false;
      }
      const parent = node.parent;
      return parent.type === 'MemberExpression' && parent.object === node;
    }

    function check(expression: TSESTree.Node): void {
      const alreadyReported = reportedRanges.some(
        range => expression.range[0] >= range[0] && expression.range[1] <= range[1],
      );
      if (alreadyReported) return;
      let count = 0;
      walk(
        expression,
        visitorKeys,
        current => {
          if (isComplexLookup(current)) count += 1;
        },
        {
          shouldDescend: current =>
            current === expression ||
            (current.type !== 'FunctionDeclaration' &&
              current.type !== 'FunctionExpression' &&
              current.type !== 'ArrowFunctionExpression'),
        },
      );
      if (count < options.minComplexLookups) return;
      reportedRanges.push(expression.range);
      context.report({
        node: expression,
        messageId: 'extractVariable',
        data: { count },
      });
    }

    function checkTest(node: TestHolder): void {
      check(node.test);
    }

    return {
      IfStatement: checkTest,
      WhileStatement: checkTest,
      DoWhileStatement: checkTest,
      ConditionalExpression: checkTest,
      CallExpression(node) {
        for (const argument of node.arguments) {
          if (SKIPPED_ARGUMENT_TYPES.has(argument.type)) continue;
          check(argument);
        }
      },
    };
  },
});
