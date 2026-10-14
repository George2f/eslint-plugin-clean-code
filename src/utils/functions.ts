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

export function analyzeMutations(fn: FunctionNode, sourceCode: TSESLint.SourceCode): MutationAnalysis {
  const analysis: MutationAnalysis = {
    mutatesThis: false,
    mutatedParameters: new Set(),
    mutatedOuterVariables: new Set(),
  };
  if (fn.body.type !== 'BlockStatement') return analysis;
  const paramNames = new Set(getParamNames(fn));
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  const range = fn.range;

  const classify = (target: TSESTree.Node): void => {
    const root = getChainRoot(target);
    if (root.type === 'ThisExpression') {
      analysis.mutatesThis = true;
      return;
    }
    if (root.type !== 'Identifier') return;
    if (paramNames.has(root.name)) {
      analysis.mutatedParameters.add(root.name);
      return;
    }
    const variable = getVariable(sourceCode, root);
    if (!variable || !isDeclaredWithinRange(variable, range)) {
      analysis.mutatedOuterVariables.add(root.name);
    }
  };

  walk(
    fn.body,
    visitorKeys,
    node => {
      if (node.type === 'AssignmentExpression') {
        classify(node.left);
        return;
      }
      if (node.type === 'UpdateExpression') {
        classify(node.argument);
        return;
      }
      if (
        node.type === 'UnaryExpression' &&
        node.operator === 'delete' &&
        unwrap(node.argument).type === 'MemberExpression'
      ) {
        classify(node.argument);
        return;
      }
      if (node.type === 'CallExpression') {
        const callee = unwrap(node.callee);
        if (callee.type !== 'MemberExpression') return;
        const method = getPropertyName(callee.property);
        if (method && MUTATING_METHODS.has(method)) {
          classify(callee.object);
        }
      }
    },
    {
      shouldDescend: node =>
        node === fn ||
        (node.type !== 'FunctionDeclaration' && node.type !== 'FunctionExpression'),
    },
  );

  return analysis;
}
