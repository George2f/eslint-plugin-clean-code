import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

const SQL_START =
  /^\s*(select|insert\s+into|update|delete\s+from|create\s+table|alter\s+table|drop\s+table)\b/i;
const SQL_SPECIAL_CHARACTER = /[,(=*]/;
const SQL_CLAUSE = /\b(from|where|values|set|into|join|order\s+by|group\s+by)\b/gi;
const HTML_ELEMENT = /<([a-z][a-z0-9-]*)(\s[^<>]*)?>[\s\S]*<\/\1>/i;

function isSql(text: string): boolean {
  if (!SQL_START.test(text)) return false;
  if (SQL_SPECIAL_CHARACTER.test(text)) return true;
  const clauses = text.match(SQL_CLAUSE);
  return clauses !== null && clauses.length >= 2;
}

function isHtml(text: string): boolean {
  return HTML_ELEMENT.test(text);
}

function getTemplateText(node: TSESTree.TemplateLiteral): string {
  return node.quasis.map(quasi => quasi.value.cooked ?? '').join(' ');
}

export default createRule({
  name: 'no-multiple-languages',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow SQL or HTML embedded in string literals; keep one language per source file (Clean Code G1)',
      cleanCodeId: 'G1',
      cleanCodeRule: 'Multiple Languages in One Source File',
    },
    messages: {
      embeddedSql:
        'SQL is embedded in this string. Move the query into a dedicated data-access module (Clean Code G1).',
      embeddedHtml:
        'HTML is embedded in this string. Move the markup into a template or component (Clean Code G1).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          checkSql: { type: 'boolean' },
          checkHtml: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ checkSql: true, checkHtml: true }],
  create(context, [options]) {
    function check(node: TSESTree.Literal | TSESTree.TemplateLiteral, text: string): void {
      if (options.checkSql && isSql(text)) {
        context.report({ node, messageId: 'embeddedSql' });
        return;
      }
      if (options.checkHtml && isHtml(text)) {
        context.report({ node, messageId: 'embeddedHtml' });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        check(node, node.value);
      },
      TemplateLiteral(node) {
        check(node, getTemplateText(node));
      },
    };
  },
});
