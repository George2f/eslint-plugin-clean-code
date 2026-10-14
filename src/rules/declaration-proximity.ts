import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getVariable } from '../utils/scope';

type MessageIds = 'farFromUsage';
type Options = { maxDistance: number }[];
type ProximityContext = TSESLint.RuleContext<MessageIds, Options>;

function shouldCheckDeclaration(parent: TSESTree.Node): boolean {
  if (parent.type === 'Program') return false;
  return (
    parent.type !== 'ForStatement' &&
    parent.type !== 'ForInStatement' &&
    parent.type !== 'ForOfStatement'
  );
}

function findFirstUseLine(variable: TSESLint.Scope.Variable): number | null {
  let firstUseStart = Number.POSITIVE_INFINITY;
  let firstUseLine: number | null = null;
  for (const reference of variable.references) {
    if (!reference.isRead()) continue;
    const identifier = reference.identifier;
    if (identifier.range[0] < firstUseStart) {
      firstUseStart = identifier.range[0];
      firstUseLine = identifier.loc.start.line;
    }
  }
  return firstUseLine;
}

function checkDeclarator(
  node: TSESTree.VariableDeclarator,
  context: ProximityContext,
  options: Options[number],
): void {
  if (node.id.type !== 'Identifier') return;
  if (!shouldCheckDeclaration(node.parent.parent)) return;
  const variable = getVariable(context.sourceCode, node.id);
  if (!variable) return;
  const firstUseLine = findFirstUseLine(variable);
  if (firstUseLine === null) return;
  const id = node.id;
  const distance = firstUseLine - id.loc.end.line;
  if (distance <= options.maxDistance) return;
  context.report({
    node,
    messageId: 'farFromUsage',
    data: { name: id.name, distance },
  });
}

export default createRule({
  name: 'declaration-proximity',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Declare variables close to where they are first used (Clean Code G10)',
      cleanCodeId: 'G10',
      cleanCodeRule: 'Vertical Separation',
    },
    messages: {
      farFromUsage:
        'Variable {{name}} is declared {{distance}} lines before its first use; move it closer (Clean Code G10).',
    },
    schema: [
      {
        type: 'object',
        properties: { maxDistance: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxDistance: 15 }],
  create(context, [options]) {
    return {
      VariableDeclarator: node => checkDeclarator(node, context, options),
    };
  },
});
