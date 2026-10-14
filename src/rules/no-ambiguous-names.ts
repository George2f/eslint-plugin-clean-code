import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getParamIdentifier } from '../utils/ast';
import { createRule } from '../utils/create-rule';

type MessageIds = 'ambiguousName' | 'confusableNames';
type Options = { confusingNames: string[] }[];
type AmbiguousNameContext = TSESLint.RuleContext<MessageIds, Options>;

function checkIdentifier(
  identifier: TSESTree.Identifier,
  context: AmbiguousNameContext,
  confusing: Set<string>,
): void {
  if (!confusing.has(identifier.name)) return;
  context.report({
    node: identifier,
    messageId: 'ambiguousName',
    data: { name: identifier.name },
  });
}

function checkParams(
  node: TSESTree.FunctionLike,
  context: AmbiguousNameContext,
  confusing: Set<string>,
): void {
  for (const param of node.params) {
    const identifier = getParamIdentifier(param);
    if (identifier) checkIdentifier(identifier, context, confusing);
  }
}

function groupVariablesByLowercaseName(
  variables: readonly TSESLint.Scope.Variable[],
): Map<string, TSESLint.Scope.Variable[]> {
  const groups = new Map<string, TSESLint.Scope.Variable[]>();
  for (const variable of variables) {
    const key = variable.name.toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.push(variable);
    } else {
      groups.set(key, [variable]);
    }
  }
  return groups;
}

function reportConfusableVariable(
  context: AmbiguousNameContext,
  variable: TSESLint.Scope.Variable,
  names: string[],
): void {
  const definition = variable.defs[0];
  if (!definition) return;
  const others = names.filter(name => name !== variable.name);
  const other = others.sort().join(', ');
  context.report({
    node: definition.name,
    messageId: 'confusableNames',
    data: { name: variable.name, other },
  });
}

function reportVariableGroup(
  context: AmbiguousNameContext,
  group: readonly TSESLint.Scope.Variable[],
): void {
  const names = [...new Set(group.map(variable => variable.name))];
  if (names.length < 2) return;
  for (const variable of group) {
    reportConfusableVariable(context, variable, names);
  }
}

function reportScopeConfusions(
  context: AmbiguousNameContext,
  variables: readonly TSESLint.Scope.Variable[],
): void {
  for (const group of groupVariablesByLowercaseName(variables).values()) {
    reportVariableGroup(context, group);
  }
}

function reportConfusableNames(context: AmbiguousNameContext): void {
  const scopeManager = context.sourceCode.scopeManager;
  if (!scopeManager) return;
  for (const scope of scopeManager.scopes) {
    reportScopeConfusions(context, scope.variables);
  }
}

export default createRule({
  name: 'no-ambiguous-names',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow names that are visually ambiguous or differ only by case (Clean Code N4)',
      cleanCodeId: 'N4',
      cleanCodeRule: 'Unambiguous Names',
    },
    messages: {
      ambiguousName:
        'Name "{{name}}" is visually ambiguous; choose a clearly distinguishable name (Clean Code N4).',
      confusableNames:
        'Name "{{name}}" is easily confused with {{other}}; rename one of them (Clean Code N4).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          confusingNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ confusingNames: ['l', 'O', 'I'] }],
  create(context, [options]) {
    const confusing = new Set(options.confusingNames);
    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') checkIdentifier(node.id, context, confusing);
      },
      FunctionDeclaration(node) {
        if (node.id) checkIdentifier(node.id, context, confusing);
        checkParams(node, context, confusing);
      },
      FunctionExpression: node => checkParams(node, context, confusing),
      ArrowFunctionExpression: node => checkParams(node, context, confusing),
      CatchClause(node) {
        if (node.param?.type === 'Identifier') {
          checkIdentifier(node.param, context, confusing);
        }
      },
      'Program:exit': () => reportConfusableNames(context),
    };
  },
});
