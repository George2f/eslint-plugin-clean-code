import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

export function getVariable(
  sourceCode: TSESLint.SourceCode,
  node: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
  let scope: TSESLint.Scope.Scope | null = sourceCode.getScope(node);
  while (scope) {
    const variable = scope.variables.find(candidate => candidate.name === node.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return null;
}

export function isDeclaredWithinRange(
  variable: TSESLint.Scope.Variable,
  range: TSESTree.Range,
): boolean {
  const definition = variable.defs[0];
  if (!definition) return false;
  const definitionRange = definition.node.range;
  return definitionRange[0] >= range[0] && definitionRange[1] <= range[1];
}

export function isLocallyBound(variable: TSESLint.Scope.Variable | null): boolean {
  if (!variable) return false;
  return variable.defs.some(definition => definition.type !== 'ImportBinding');
}
