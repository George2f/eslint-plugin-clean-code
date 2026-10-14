import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { isDirectiveComment } from '../utils/comments';
import { splitWords } from '../utils/naming';

type MessageIds = 'redundantComment' | 'removeComment';
type RedundantCommentContext = TSESLint.RuleContext<MessageIds, never[]>;

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const CODE_WORD = /[A-Za-z_$][\w$]*/g;
const COMMENT_WORD = /[A-Za-z]{3,}/g;
const LOOKAHEAD_LINES = 3;

function isCommentOnlyLine(lines: readonly string[], lineIndex: number): boolean {
  const line = lines[lineIndex];
  return line === undefined || COMMENT_LINE.test(line);
}

function findTargetLine(
  comment: TSESTree.Comment,
  lines: readonly string[],
): number | undefined {
  const startIndex = comment.loc.start.line - 1;
  const before = lines[startIndex].slice(0, comment.loc.start.column);
  const trimmedBefore = before.trim();
  if (trimmedBefore.length > 0) return startIndex;
  for (let offset = 1; offset <= LOOKAHEAD_LINES; offset += 1) {
    const index = comment.loc.end.line - 1 + offset;
    const line = lines[index];
    if (line === undefined) return undefined;
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0 || isCommentOnlyLine(lines, index)) continue;
    return index;
  }
  return undefined;
}

function codeWordSet(text: string): Set<string> {
  const words = new Set<string>();
  for (const token of text.match(CODE_WORD) ?? []) {
    for (const part of splitWords(token)) words.add(part);
  }
  return words;
}

function reportIfRedundant(
  context: RedundantCommentContext,
  comment: TSESTree.Comment,
  commentWords: string[],
  targetLine: string,
): void {
  const codeWords = codeWordSet(targetLine);
  const isRedundant = commentWords.every(word => codeWords.has(word.toLowerCase()));
  if (!isRedundant) return;
  context.report({
    loc: comment.loc,
    messageId: 'redundantComment',
    suggest: [
      {
        messageId: 'removeComment',
        fix: fixer => fixer.removeRange(comment.range),
      },
    ],
  });
}

function scanComments(context: RedundantCommentContext): void {
  const sourceCode = context.sourceCode;
  const lines = sourceCode.lines;
  for (const comment of sourceCode.getAllComments()) {
    if (isDirectiveComment(comment.value)) continue;
    const commentWords = comment.value.match(COMMENT_WORD);
    if (!commentWords || commentWords.length < 2) continue;
    const targetIndex = findTargetLine(comment, lines);
    if (targetIndex === undefined) continue;
    reportIfRedundant(context, comment, commentWords, lines[targetIndex]);
  }
}

export default createRule({
  name: 'no-redundant-comments',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow comments that restate the adjacent code (Clean Code C3)',
      cleanCodeId: 'C3',
      cleanCodeRule: 'Redundant Comment',
    },
    messages: {
      redundantComment:
        'This comment restates the adjacent code; remove it so the code speaks for itself (Clean Code C3).',
      removeComment: 'Remove the comment.',
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
