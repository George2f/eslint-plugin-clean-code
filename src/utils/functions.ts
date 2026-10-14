import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getChainRoot, getParamNames, getPropertyName, unwrap, walk } from './ast';
import type { FunctionNode, VisitorKeys } from './ast';
import { getVariable, isDeclaredWithinRange } from './scope';

const MUTATING_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
  'set',
  'add',
  'delete',
  'clear',
]);

export interface MutationAnalysis {
  mutatesThis: boolean;
  mutatedParameters: Set<string>;
  mutatedOuterVariables: Set<string>;
}

type TargetClassification =
  | { kind: 'this' }
  | { kind: 'parameter'; name: string }
  | { kind: 'outer'; name: string }
  | undefined;

interface ClassificationLookup {
  sourceCode: TSESLint.SourceCode;
  paramNames: Set<string>;
  range: TSESTree.Range;
}

function createMutationAnalysis(): MutationAnalysis {
  return {
    mutatesThis: false,
    mutatedParameters: new Set(),
    mutatedOuterVariables: new Set(),
  };
}

function mutatedCallTarget(node: TSESTree.CallExpression): TSESTree.Node | undefined {
  const callee = unwrap(node.callee);
  if (callee.type !== 'MemberExpression') return undefined;
  const method = getPropertyName(callee.property);
  if (method && MUTATING_METHODS.has(method)) return callee.object;
  return undefined;
}

function mutationTargetOf(node: TSESTree.Node): TSESTree.Node | undefined {
  if (node.type === 'AssignmentExpression') return node.left;
  if (node.type === 'UpdateExpression') return node.argument;
  if (node.type === 'UnaryExpression' && node.operator === 'delete') {
    const argument = unwrap(node.argument);
    return argument.type === 'MemberExpression' ? node.argument : undefined;
  }
  if (node.type === 'CallExpression') return mutatedCallTarget(node);
  return undefined;
}

function classifyMutationTarget(
  target: TSESTree.Node,
  context: ClassificationLookup,
): TargetClassification {
  const root = getChainRoot(target);
  if (root.type === 'ThisExpression') return { kind: 'this' };
  if (root.type !== 'Identifier') return undefined;
  if (context.paramNames.has(root.name)) return { kind: 'parameter', name: root.name };
  const variable = getVariable(context.sourceCode, root);
  if (variable && isDeclaredWithinRange(variable, context.range)) return undefined;
  return { kind: 'outer', name: root.name };
}

function shouldEnterNode(node: TSESTree.Node, fn: FunctionNode): boolean {
  if (node === fn) return true;
  return node.type !== 'FunctionDeclaration' && node.type !== 'FunctionExpression';
}

export function analyzeMutations(
  fn: FunctionNode,
  sourceCode: TSESLint.SourceCode,
): MutationAnalysis {
  const analysis = createMutationAnalysis();
  if (fn.body.type !== 'BlockStatement') return analysis;
  const context: ClassificationLookup = {
    sourceCode,
    paramNames: new Set(getParamNames(fn)),
    range: fn.range,
  };
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  walk(
    fn.body,
    visitorKeys,
    node => {
      const target = mutationTargetOf(node);
      if (!target) return;
      const classification = classifyMutationTarget(target, context);
      if (!classification) return;
      if (classification.kind === 'this') analysis.mutatesThis = true;
      else if (classification.kind === 'parameter') analysis.mutatedParameters.add(classification.name);
      else analysis.mutatedOuterVariables.add(classification.name);
    },
    { shouldDescend: node => shouldEnterNode(node, fn) },
  );
  return analysis;
}
