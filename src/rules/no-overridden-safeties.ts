import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

type MessageIds = 'emptyCatch' | 'tsDirective' | 'disableWithoutReason' | 'useTsExpectError';
type Options = {
  allowEmptyCatch: boolean;
  allowTsIgnore: boolean;
  requireDisableReason: boolean;
}[];
type SafetyContext = TSESLint.RuleContext<MessageIds, Options>;

const TS_DIRECTIVE = /^\s*@ts-(ignore|nocheck)\b/;
const ESLINT_DISABLE = /^\s*eslint-disable(?:-next-line|-line)?\b/;
const TS_IGNORE = '@ts-ignore';

function checkCatchClause(
  node: TSESTree.CatchClause,
  context: SafetyContext,
  options: Options[number],
): void {
  if (options.allowEmptyCatch) return;
  if (node.body.body.length > 0) return;
  const comments = context.sourceCode.getCommentsInside(node);
  if (comments.length > 0) return;
  context.report({ node, messageId: 'emptyCatch' });
}

function replaceDirectiveRange(
  fixer: TSESLint.RuleFixer,
  comment: TSESTree.Comment,
  ignoreIndex: number,
): TSESLint.RuleFix {
  const rangeStart = comment.range[0] + ignoreIndex;
  const rangeEnd = rangeStart + TS_IGNORE.length;
  return fixer.replaceTextRange([rangeStart, rangeEnd], '@ts-expect-error');
}

function reportTsDirective(comment: TSESTree.Comment, context: SafetyContext): boolean {
  const match = TS_DIRECTIVE.exec(comment.value);
  if (!match) return false;
  const raw = context.sourceCode.getText(comment);
  const ignoreIndex = raw.indexOf(TS_IGNORE);
  const canSuggest = match[1] === 'ignore' && ignoreIndex !== -1;
  context.report({
    loc: comment.loc,
    messageId: 'tsDirective',
    data: { directive: `@ts-${match[1]}` },
    suggest: canSuggest
      ? [
          {
            messageId: 'useTsExpectError',
            fix: fixer => replaceDirectiveRange(fixer, comment, ignoreIndex),
          },
        ]
      : undefined,
  });
  return true;
}

function checkDisableReason(
  comment: TSESTree.Comment,
  context: SafetyContext,
  options: Options[number],
): void {
  if (!options.requireDisableReason) return;
  if (!ESLINT_DISABLE.test(comment.value)) return;
  if (comment.value.includes(' -- ')) return;
  context.report({ loc: comment.loc, messageId: 'disableWithoutReason' });
}

function checkComment(
  comment: TSESTree.Comment,
  context: SafetyContext,
  options: Options[number],
): void {
  if (!options.allowTsIgnore && reportTsDirective(comment, context)) return;
  checkDisableReason(comment, context, options);
}

function scanComments(context: SafetyContext, options: Options[number]): void {
  for (const comment of context.sourceCode.getAllComments()) {
    checkComment(comment, context, options);
  }
}

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
      CatchClause: node => checkCatchClause(node, context, options),
      Program: () => scanComments(context, options),
    };
  },
});
