import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getParamIdentifier } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'singleLetterName' | 'vagueName';
type Options = { allow: string[]; forbidden: string[] }[];
type DescriptiveNamesContext = TSESLint.RuleContext<MessageIds, Options>;

function checkIdentifier(
  identifier: TSESTree.Identifier,
  context: DescriptiveNamesContext,
  allowed: Set<string>,
  forbidden: Set<string>,
): void {
  const name = identifier.name;
  if (name.startsWith('_')) return;
  if (name.length === 1 && !allowed.has(name)) {
    context.report({ node: identifier, messageId: 'singleLetterName', data: { name } });
    return;
  }
  if (forbidden.has(name.toLowerCase())) {
    context.report({ node: identifier, messageId: 'vagueName', data: { name } });
  }
}

function checkParams(
  node: TSESTree.FunctionLike,
  context: DescriptiveNamesContext,
  allowed: Set<string>,
  forbidden: Set<string>,
): void {
  for (const param of node.params) {
    const identifier = getParamIdentifier(param);
    if (identifier) checkIdentifier(identifier, context, allowed, forbidden);
  }
}

export default createRule({
  name: 'descriptive-names',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow single-letter and vague variable names (Clean Code N1)',
      cleanCodeId: 'N1',
      cleanCodeRule: 'Choose Descriptive Names',
    },
    messages: {
      singleLetterName:
        'Name "{{name}}" is a single letter; choose a descriptive name instead (Clean Code N1).',
      vagueName: 'Name "{{name}}" is too vague; choose a name that reveals intent (Clean Code N1).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
          forbidden: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_'],
      forbidden: [
        'data',
        'info',
        'stuff',
        'thing',
        'temp',
        'tmp',
        'foo',
        'bar',
        'baz',
        'obj',
        'arr',
        'val',
        'utils',
        'misc',
      ],
    },
  ],
  create(context, [options]) {
    const allowed = new Set(options.allow);
    const forbidden = new Set(options.forbidden);
    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          checkIdentifier(node.id, context, allowed, forbidden);
        }
      },
      FunctionDeclaration(node) {
        if (node.id) checkIdentifier(node.id, context, allowed, forbidden);
        checkParams(node, context, allowed, forbidden);
      },
      FunctionExpression: node => checkParams(node, context, allowed, forbidden),
      ArrowFunctionExpression: node => checkParams(node, context, allowed, forbidden),
      CatchClause(node) {
        if (node.param?.type === 'Identifier') {
          checkIdentifier(node.param, context, allowed, forbidden);
        }
      },
    };
  },
});
