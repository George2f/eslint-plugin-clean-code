import { createRule } from '../utils/create-rule';

const DEFAULT_PATTERNS: RegExp[] = [
  /@author\b/i,
  /\bauthor\s*:/i,
  /\bcreated\s+(by|on|at)\b/i,
  /\bmodified\s+(by|on)\b/i,
  /\bchangelog\b/i,
  /\bchange\s+log\b/i,
  /\b\d{4}-\d{1,2}-\d{1,2}\b/,
];

export default createRule({
  name: 'no-inappropriate-comments',
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description: 'Disallow comments holding information managed by version control (Clean Code C1)',
      cleanCodeId: 'C1',
      cleanCodeRule: 'Inappropriate Information',
    },
    messages: {
      inappropriateComment:
        'Move author tags, dates and change logs out of comments; version control already tracks them (Clean Code C1).',
      removeComment: 'Remove the comment.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          patterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ patterns: [] as string[] }],
  create(context, [options]) {
    const patterns = [
      ...DEFAULT_PATTERNS,
      ...options.patterns.map(source => new RegExp(source, 'i')),
    ];
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (patterns.some(pattern => pattern.test(comment.value))) {
            context.report({
              loc: comment.loc,
              messageId: 'inappropriateComment',
              suggest: [
                {
                  messageId: 'removeComment',
                  fix: fixer => fixer.removeRange(comment.range),
                },
              ],
            });
          }
        }
      },
    };
  },
});
