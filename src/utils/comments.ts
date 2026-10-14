import * as espree from 'espree';
import type { TSESTree } from '@typescript-eslint/utils';

const DIRECTIVE_PATTERNS: RegExp[] = [
  /^\s*eslint(?:-|\s|$)/i,
  /^\s*globals?\b/i,
  /^\s*exported\b/i,
  /^\s*prettier-ignore/i,
  /^\s*@ts-/i,
  /^\s*ts-(?:check|ignore|nocheck|expect-error)/i,
  /^\s*istanbul\b/i,
  /^\s*c8\b/i,
  /^\s*v8\b/i,
  /^\s*biome-ignore/i,
  /^\s*deno-lint/i,
  /^\s*oxlint/i,
  /^\s*tslint/i,
  /^\s*@flow/i,
  /^\s*flow\b/i,
  /^\s*noflow\b/i,
  /^\s*sourceMappingURL/i,
  /^\s*@license\b/i,
  /^\s*@preserve\b/i,
  /^\s*(?:TODO|FIXME|XXX|HACK|NOTE)\b/i,
  /^\s*@vue/i,
  /^\s*@svelte/i,
  /^\s*@jsx/i,
  /^\s*jshint\b/i,
  /^\s*jslint\b/i,
];

const KEYWORD_LINE =
  /^\s*(?:if|for|while|return|const|let|var|function|class|import|export|switch|case|break|continue|throw|try|catch|finally|else|do|new|await|async|typeof|instanceof|delete|void|yield)\b/;

const NON_CODE_EXPRESSIONS = new Set(['Identifier', 'Literal', 'TemplateLiteral', 'JSXText']);

const MIN_COMMENT_CODE_LENGTH = 3;

interface LooseNode {
  type: string;
  body?: unknown;
  expression?: unknown;
  [key: string]: unknown;
}

export function isDirectiveComment(text: string): boolean {
  return DIRECTIVE_PATTERNS.some(pattern => pattern.test(text));
}

export function isJsDocComment(comment: TSESTree.Comment): boolean {
  return comment.type === 'Block' && comment.value.startsWith('*');
}

function stripStarPrefix(line: string): string {
  return line.replace(/^\s*\*\s?/, '');
}

function hasStarPrefix(lines: string[]): boolean {
  const firstLine = lines[0];
  const trimmedFirstLine = firstLine?.trimStart();
  return trimmedFirstLine?.startsWith('*') ?? false;
}

export function stripCommentMarkers(comment: TSESTree.Comment): string {
  if (comment.type !== 'Block') return comment.value;
  const lines = comment.value.split('\n');
  if (!hasStarPrefix(lines)) return comment.value;
  return lines.map(stripStarPrefix).join('\n');
}

function tryParse(text: string): LooseNode | null {
  try {
    return espree.parse(text, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as unknown as LooseNode;
  } catch {
    // try wrapping below
  }
  try {
    const wrapped = espree.parse(`async function __cc__() {\n${text}\n}`, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as unknown as LooseNode;
    const fn = Array.isArray(wrapped.body) ? (wrapped.body[0] as LooseNode | undefined) : undefined;
    const functionBody = fn?.body as LooseNode | undefined;
    if (functionBody && Array.isArray(functionBody.body)) {
      return { type: 'Program', body: functionBody.body };
    }
    return null;
  } catch {
    return null;
  }
}

function isMeaningfulStatement(statement: LooseNode): boolean {
  if (statement.type === 'EmptyStatement') return false;
  if (statement.type === 'LabeledStatement') return false;
  if (statement.type === 'ExpressionStatement') {
    const expression = statement.expression as LooseNode | undefined;
    if (!expression) return false;
    return !NON_CODE_EXPRESSIONS.has(expression.type);
  }
  return true;
}

function programIsMeaningful(program: LooseNode): boolean {
  const body = Array.isArray(program.body) ? (program.body as LooseNode[]) : [];
  const meaningful = body.filter(isMeaningfulStatement);
  if (meaningful.length === 0) return false;
  return body.length > 1 || meaningful.length === body.length;
}

function endsOpeningLine(line: string): boolean {
  const withoutTrailingSpace = line.trimEnd();
  return /[;{(=]$/.test(withoutTrailingSpace);
}

function isStrongCodeLine(line: string): boolean {
  return /[;]$/.test(line) && /[=]|\(\)|\(.*\)|\{|\}/.test(line);
}

function linesLookLikeCode(lines: string[]): boolean {
  const trimmedLines = lines.map(line => line.trim()).filter(Boolean);
  if (trimmedLines.length === 0) return false;
  if (trimmedLines.some(line => KEYWORD_LINE.test(line) && endsOpeningLine(line))) {
    return true;
  }
  const strongLines = trimmedLines.filter(isStrongCodeLine);
  return strongLines.length >= 2;
}

export function isCommentedOutCode(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_COMMENT_CODE_LENGTH) return false;
  if (isDirectiveComment(trimmed)) return false;
  const program = tryParse(trimmed);
  if (program) return programIsMeaningful(program);
  return linesLookLikeCode(trimmed.split('\n'));
}
