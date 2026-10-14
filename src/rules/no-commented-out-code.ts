import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { isCommentedOutCode, isDirectiveComment, isJsDocComment, stripCommentMarkers } from '../utils/comments';

export default createRule({
  name: 'no-commented-out-code',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow commented-out code (Clean Code C5)',
      cleanCodeId: 'C5',
      cleanCodeRule: 'Commented-Out Code',
    },
    messages: {
      commentedOutCode:
        'Delete commented-out code instead of keeping it; version control remembers it (Clean Code C5).',
      removeCommentedOutCode: 'Remove the commented-out code.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program() {
        const comments = context.sourceCode.getAllComments();
        let index = 0;
        while (index < comments.length) {
          const comment = comments[index];
          if (comment.type === 'Line') {
            const group: TSESTree.Comment[] = [comment];
            while (index + 1 < comments.length) {
              const next = comments[index + 1];
              const last = group[group.length - 1];
              if (
                next.type === 'Line' &&
                last &&
                next.loc.start.line === last.loc.end.line + 1
              ) {
                group.push(next);
                index += 1;
              } else {
                break;
              }
            }
            const text = group.map(item => item.value).join('\n');
            if (!isDirectiveComment(text) && isCommentedOutCode(text)) {
              const first = group[0];
              const last = group[group.length - 1];
              if (first && last) {
                context.report({
                  loc: { start: first.loc.start, end: last.loc.end },
                  messageId: 'commentedOutCode',
                  suggest: [
                    {
                      messageId: 'removeCommentedOutCode',
                      fix: fixer => fixer.removeRange([first.range[0], last.range[1]]),
                    },
                  ],
                });
              }
            }
          } else if (!isJsDocComment(comment)) {
            const text = stripCommentMarkers(comment);
            if (!isDirectiveComment(text) && isCommentedOutCode(text)) {
              context.report({
                loc: comment.loc,
                messageId: 'commentedOutCode',
                suggest: [
                  {
                    messageId: 'removeCommentedOutCode',
                    fix: fixer => fixer.removeRange(comment.range),
                  },
                ],
              });
            }
          }
          index += 1;
        }
      },
    };
  },
});
