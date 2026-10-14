import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { isCommentedOutCode, isDirectiveComment, isJsDocComment, stripCommentMarkers } from '../utils/comments';

type MessageIds = 'commentedOutCode' | 'removeCommentedOutCode';
type CommentContext = TSESLint.RuleContext<MessageIds, never[]>;

function isConsecutiveLineComment(
  next: TSESTree.Comment,
  last: TSESTree.Comment | undefined,
): boolean {
  if (next.type !== 'Line' || !last) return false;
  return next.loc.start.line === last.loc.end.line + 1;
}

function collectLineGroup(
  comments: TSESTree.Comment[],
  startIndex: number,
): TSESTree.Comment[] {
  const group: TSESTree.Comment[] = [comments[startIndex]];
  let cursor = startIndex + 1;
  while (cursor < comments.length) {
    const next = comments[cursor];
    if (!isConsecutiveLineComment(next, group.at(-1))) break;
    group.push(next);
    cursor += 1;
  }
  return group;
}

function reportComment(
  context: CommentContext,
  loc: TSESTree.SourceLocation,
  range: TSESTree.Range,
): void {
  context.report({
    loc,
    messageId: 'commentedOutCode',
    suggest: [
      {
        messageId: 'removeCommentedOutCode',
        fix: fixer => fixer.removeRange(range),
      },
    ],
  });
}

function reportLineGroup(context: CommentContext, group: TSESTree.Comment[]): void {
  const first = group[0];
  const last = group.at(-1);
  if (!first || !last) return;
  const text = group.map(item => item.value).join('\n');
  if (isDirectiveComment(text) || !isCommentedOutCode(text)) return;
  const loc = { start: first.loc.start, end: last.loc.end };
  reportComment(context, loc, [first.range[0], last.range[1]]);
}

function reportBlockComment(context: CommentContext, comment: TSESTree.Comment): void {
  const text = stripCommentMarkers(comment);
  if (isDirectiveComment(text) || !isCommentedOutCode(text)) return;
  reportComment(context, comment.loc, comment.range);
}

function scanComments(context: CommentContext): void {
  const comments = context.sourceCode.getAllComments();
  let index = 0;
  while (index < comments.length) {
    const comment = comments[index];
    if (comment.type === 'Line') {
      const group = collectLineGroup(comments, index);
      reportLineGroup(context, group);
      index += group.length;
      continue;
    }
    if (!isJsDocComment(comment)) reportBlockComment(context, comment);
    index += 1;
  }
}

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
      Program: () => scanComments(context),
    };
  },
});
