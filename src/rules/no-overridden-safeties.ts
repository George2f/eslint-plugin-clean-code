import { createRule } from '../utils/create-rule';

const TS_DIRECTIVE = /^\s*@ts-(ignore|nocheck)\b/;
const ESLINT_DISABLE = /^\s*eslint-disable(?:-next-line|-line)?\b/;

export default createRule({
  name: 'no-overridden-safeties',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description:
        'Disallow disabled safety mechanisms such as empty catches and ts-ignore (Clean Code G4)',
      cleanCodeId: 'G4',
      cleanCodeRule: 'Overridden Safeties',
    },
    messages: {
      emptyCatch:
        'Empty catch block hides failures; handle the error or explain why ignoring it is safe (Clean Code G4).',
      tsDirective:
        '{{directive}} overrides type safety; fix the underlying error instead of silencing it (Clean Code G4).',
      disableWithoutReason:
        'ESLint disable directives need a reason after "--" explaining why the rule is suppressed (Clean Code G4).',
      useTsExpectError: 'Use @ts-expect-error instead of @ts-ignore.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowEmptyCatch: { type: 'boolean' },
          allowTsIgnore: { type: 'boolean' },
          requireDisableReason: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    { allowEmptyCatch: false, allowTsIgnore: false, requireDisableReason: true },
  ],
  create(context, [options]) {
    return {
      CatchClause(node) {
        if (options.allowEmptyCatch) return;
        if (node.body.body.length > 0) return;
        if (context.sourceCode.getCommentsInside(node).length > 0) return;
        context.report({ node, messageId: 'emptyCatch' });
      },
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (!options.allowTsIgnore) {
            const match = TS_DIRECTIVE.exec(comment.value);
            if (match) {
              const raw = context.sourceCode.getText(comment);
              const ignoreIndex = raw.indexOf('@ts-ignore');
              context.report({
                loc: comment.loc,
                messageId: 'tsDirective',
                data: { directive: `@ts-${match[1]}` },
                suggest:
                  match[1] === 'ignore' && ignoreIndex !== -1
                    ? [
                        {
                          messageId: 'useTsExpectError',
                          fix: fixer =>
                            fixer.replaceTextRange(
                              [
                                comment.range[0] + ignoreIndex,
                                comment.range[0] + ignoreIndex + '@ts-ignore'.length,
                              ],
                              '@ts-expect-error',
                            ),
                        },
                      ]
                    : undefined,
              });
              continue;
            }
          }
          if (
            options.requireDisableReason &&
            ESLINT_DISABLE.test(comment.value) &&
            !comment.value.includes(' -- ')
          ) {
            context.report({ loc: comment.loc, messageId: 'disableWithoutReason' });
          }
        }
      },
    };
  },
});
