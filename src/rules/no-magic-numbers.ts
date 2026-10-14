import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getCalleeName, unwrap } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'magicNumber';
type Options = {
  ignore: number[];
  ignoreDefaultValues: boolean;
  ignoreArrayIndexes: boolean;
  ignoreEnums: boolean;
}[];
type MagicNumberContext = TSESLint.RuleContext<MessageIds, Options>;

const TYPE_NODE_PREFIX = 'TS';
const VALUE_CONTEXT_PARENTS = new Set(['ObjectExpression', 'Property', 'AssignmentExpression']);

interface LiteralSite {
  node: TSESTree.Literal;
  parent: TSESTree.Node;
  fullNode: TSESTree.Node;
  container: TSESTree.Node;
}

function isParseIntRadix(fullNumberNode: TSESTree.Node): boolean {
  const parent = fullNumberNode.parent;
  if (!parent || parent.type !== 'CallExpression') return false;
  return parent.arguments[1] === fullNumberNode && getCalleeName(unwrap(parent.callee)) === 'parseInt';
}

function isIgnoredByEnumAncestors(node: TSESTree.Node, options: Options[number]): boolean {
  let ancestor: TSESTree.Node | undefined = node.parent;
  while (ancestor) {
    if (ancestor.type === 'TSEnumMember') return options.ignoreEnums;
    if (!ancestor.type.startsWith(TYPE_NODE_PREFIX) && ancestor.type !== 'Literal') {
      return false;
    }
    ancestor = ancestor.parent;
  }
  return false;
}

function isPropertyKey(site: LiteralSite): boolean {
  const { parent, node } = site;
  return parent.type === 'Property' && parent.key === node && !parent.computed;
}

function isMemberProperty(site: LiteralSite): boolean {
  const { parent, node } = site;
  return parent.type === 'MemberExpression' && parent.property === node && !parent.computed;
}

function isComputedMemberProperty(parent: TSESTree.Node, node: TSESTree.Node): boolean {
  return parent.type === 'MemberExpression' && parent.computed && parent.property === node;
}

function isAllowedArrayIndex(site: LiteralSite, options: Options[number]): boolean {
  return options.ignoreArrayIndexes && isComputedMemberProperty(site.parent, site.node);
}

function isDefaultValue(site: LiteralSite, options: Options[number]): boolean {
  return (
    options.ignoreDefaultValues &&
    site.parent.type === 'AssignmentPattern' &&
    site.parent.right === site.node
  );
}

function isAllowedSite(site: LiteralSite, options: Options[number]): boolean {
  if (site.container.type === 'TSLiteralType') return true;
  if (isIgnoredByEnumAncestors(site.node, options)) return true;
  if (isPropertyKey(site)) return true;
  if (isMemberProperty(site)) return true;
  if (isAllowedArrayIndex(site, options)) return true;
  if (isDefaultValue(site, options)) return true;
  if (VALUE_CONTEXT_PARENTS.has(site.container.type)) return true;
  if (site.container.type === 'VariableDeclarator') return true;
  if (site.container.type.startsWith('JSX')) return true;
  return isParseIntRadix(site.fullNode);
}

function checkLiteral(
  node: TSESTree.Literal,
  context: MagicNumberContext,
  options: Options[number],
  ignored: Set<number>,
): void {
  if (typeof node.value !== 'number') return;
  const parent = node.parent;
  const isNegated = parent.type === 'UnaryExpression' && parent.operator === '-';
  const fullNode: TSESTree.Node = isNegated ? parent : node;
  const container = fullNode.parent;
  const value = isNegated ? -node.value : node.value;
  if (ignored.has(value)) return;
  if (isAllowedSite({ node, parent, fullNode, container }, options)) return;
  context.report({
    node: fullNode,
    messageId: 'magicNumber',
    data: { value },
  });
}

export default createRule({
  name: 'no-magic-numbers',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow magic numbers; replace them with named constants (Clean Code G25)',
      cleanCodeId: 'G25',
      cleanCodeRule: 'Replace Magic Numbers with Named Constants',
    },
    messages: {
      magicNumber: 'Magic number {{value}}. Extract it into a named constant (Clean Code G25).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignore: { type: 'array', items: { type: 'number' } },
          ignoreDefaultValues: { type: 'boolean' },
          ignoreArrayIndexes: { type: 'boolean' },
          ignoreEnums: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      ignore: [0, 1, 2, -1],
      ignoreDefaultValues: true,
      ignoreArrayIndexes: false,
      ignoreEnums: true,
    },
  ],
  create(context, [options]) {
    const ignored = new Set(options.ignore);
    return {
      Literal: node => checkLiteral(node, context, options, ignored),
    };
  },
});
