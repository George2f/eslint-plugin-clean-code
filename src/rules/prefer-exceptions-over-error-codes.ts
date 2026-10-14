import { createRule } from '../utils/create-rule';
import { unwrap } from '../utils/ast';

export default createRule({
  name: 'prefer-exceptions-over-error-codes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow returning -1 as an error code; prefer exceptions (Clean Code Ch3)',
      cleanCodeId: 'Ch3',
      cleanCodeRule: 'Prefer Exceptions to Returning Error Codes',
    },
    messages: {
      errorCodeReturn:
        'Do not return -1 as an error code; throw an exception instead (Clean Code Ch3).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ReturnStatement(node) {
        const argument = node.argument;
        if (!argument || argument.type !== 'UnaryExpression' || argument.operator !== '-') {
          return;
        }
        const target = unwrap(argument.argument);
        if (target.type !== 'Literal' || typeof target.value !== 'number' || target.value !== 1) {
          return;
        }
        context.report({ node, messageId: 'errorCodeReturn' });
      },
    };
  },
});
