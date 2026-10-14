import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getFunctionName, isFunctionNode } from '../utils/ast';
import { containsWord } from '../utils/naming';

const MULTI_ACTION_WORDS = ['and', 'or'];

export default createRule({
  name: 'function-does-one-thing',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that functions do one thing and stay short (Clean Code G30)',
      cleanCodeId: 'G30',
      cleanCodeRule: 'Functions Should Do One Thing',
    },
    messages: {
      nameSuggestsMultipleThings:
        'Function "{{name}}" reads as multiple actions; split it into one function per action (Clean Code G30).',
      functionTooLong:
        'Function has {{statements}} statements and {{lines}} lines; keep it within {{maxStatements}} statements and {{maxLines}} lines (Clean Code G30).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxStatements: { type: 'integer', minimum: 1 },
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxStatements: 20, maxLines: 30 }],
  create(context, [options]) {
    function check(node: TSESTree.FunctionLike): void {
      if (!isFunctionNode(node)) return;
      const name = getFunctionName(node);
      if (name && containsWord(name, MULTI_ACTION_WORDS)) {
        context.report({
          node,
          messageId: 'nameSuggestsMultipleThings',
          data: { name },
        });
      }
      if (node.body.type !== 'BlockStatement') return;
      const statements = node.body.body.length;
      const lines = node.body.loc.end.line - node.body.loc.start.line + 1;
      if (statements > options.maxStatements || lines > options.maxLines) {
        context.report({
          node,
          messageId: 'functionTooLong',
          data: {
            statements,
            maxStatements: options.maxStatements,
            lines,
            maxLines: options.maxLines,
          },
        });
      }
    }
    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
