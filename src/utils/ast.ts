import type { TSESTree } from '@typescript-eslint/utils';

export type VisitorKeys = Record<string, readonly string[] | undefined>;

export type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

export interface WalkOptions {
  shouldDescend?: (node: TSESTree.Node) => boolean;
}

export function walk(
  root: TSESTree.Node,
  visitorKeys: VisitorKeys,
  enter: (node: TSESTree.Node) => boolean | void,
  options: WalkOptions = {},
): void {
  if (enter(root) === false) return;
  if (options.shouldDescend && !options.shouldDescend(root)) return;
  const keys = visitorKeys[root.type] ?? [];
  for (const key of keys) {
    const value = (root as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) walk(item, visitorKeys, enter, options);
      }
    } else if (isNode(value)) {
      walk(value, visitorKeys, enter, options);
    }
  }
}

export function unwrap(node: TSESTree.Node): TSESTree.Node {
  let current = node;
  while (
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression' ||
    current.type === 'TSTypeAssertion' ||
    current.type === 'TSInstantiationExpression'
  ) {
    current = current.expression;
  }
  return current;
}

export function isFunctionNode(node: TSESTree.Node): node is FunctionNode {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  );
}

export function getPropertyName(node: TSESTree.Node | undefined): string | undefined {
  if (!node) return undefined;
  switch (node.type) {
    case 'Identifier':
    case 'PrivateIdentifier':
      return node.name;
    case 'Literal':
      if (typeof node.value === 'string') return node.value;
      if (typeof node.value === 'number') return String(node.value);
      return undefined;
    case 'TemplateLiteral':
      return node.expressions.length === 0
        ? node.quasis.map(quasi => quasi.value.cooked ?? '').join('')
        : undefined;
    default:
      return undefined;
  }
}

export function getCalleeName(callee: TSESTree.Node): string | undefined {
  const target = unwrap(callee);
  if (target.type === 'Identifier') return target.name;
  if (target.type === 'MemberExpression') return getPropertyName(target.property);
  return undefined;
}

export function getChainRoot(node: TSESTree.Node): TSESTree.Node {
  let current = unwrap(node);
  while (true) {
    if (current.type === 'ChainExpression') {
      current = unwrap(current.expression);
      continue;
    }
    if (current.type === 'MemberExpression') {
      current = unwrap(current.object);
      continue;
    }
    if (current.type === 'CallExpression') {
      const callee = unwrap(current.callee);
      if (callee.type === 'MemberExpression') {
        current = unwrap(callee.object);
        continue;
      }
      return callee;
    }
    return current;
  }
}

export function getFunctionName(node: FunctionNode): string | undefined {
  if (node.type === 'FunctionDeclaration') return node.id?.name;
  if (node.type === 'FunctionExpression' && node.id) return node.id.name;
  const parent = node.parent;
  if (!parent) return undefined;
  if (
    parent.type === 'MethodDefinition' ||
    parent.type === 'PropertyDefinition' ||
    parent.type === 'Property'
  ) {
    return getPropertyName(parent.key);
  }
  if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent.type === 'AssignmentExpression' && parent.left.type === 'Identifier') {
    return parent.left.name;
  }
  return undefined;
}

export function getParamIdentifier(param: TSESTree.Parameter): TSESTree.Identifier | undefined {
  if (param.type === 'Identifier') return param;
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') return param.left;
  if (param.type === 'RestElement' && param.argument.type === 'Identifier') return param.argument;
  if (param.type === 'TSParameterProperty') return getParamIdentifier(param.parameter);
  return undefined;
}

export function getParamNames(node: FunctionNode): string[] {
  const names: string[] = [];
  for (const param of node.params) {
    const identifier = getParamIdentifier(param);
    if (identifier) names.push(identifier.name);
  }
  return names;
}

export function isNullLiteral(node: TSESTree.Node): boolean {
  return node.type === 'Literal' && node.value === null;
}

export function isBooleanLiteral(node: TSESTree.Node): boolean {
  return node.type === 'Literal' && typeof node.value === 'boolean';
}

export function countLogicalOperators(node: TSESTree.Node, visitorKeys: VisitorKeys): number {
  let count = 0;
  walk(node, visitorKeys, current => {
    if (current.type === 'LogicalExpression') count += 1;
  });
  return count;
}

function rootJsxIdentifier(
  node: TSESTree.JSXTagNameExpression,
): TSESTree.JSXIdentifier | undefined {
  let current = node;
  while (current.type === 'JSXMemberExpression') {
    current = current.object;
  }
  return current.type === 'JSXIdentifier' ? current : undefined;
}

export function collectJsxComponentNames(
  program: TSESTree.Program,
  visitorKeys: VisitorKeys,
): Set<string> {
  const names = new Set<string>();
  walk(program, visitorKeys, node => {
    if (node.type !== 'JSXOpeningElement' && node.type !== 'JSXClosingElement') return;
    const tag = rootJsxIdentifier(node.name);
    if (!tag) return;
    if (node.name.type === 'JSXMemberExpression') {
      names.add(tag.name);
      return;
    }
    const first = tag.name.charAt(0);
    if (first !== '' && first === first.toUpperCase()) {
      names.add(tag.name);
    }
  });
  return names;
}
