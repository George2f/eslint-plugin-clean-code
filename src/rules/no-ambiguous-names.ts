import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { getParamIdentifier } from '../utils/ast';
import { createRule } from '../utils/create-rule';

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

    function checkIdentifier(identifier: TSESTree.Identifier): void {
      if (confusing.has(identifier.name)) {
        context.report({
          node: identifier,
          messageId: 'ambiguousName',
          data: { name: identifier.name },
        });
      }
    }

    function checkParams(node: TSESTree.FunctionLike): void {
      for (const param of node.params) {
        const identifier = getParamIdentifier(param);
        if (identifier) checkIdentifier(identifier);
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') checkIdentifier(node.id);
      },
      FunctionDeclaration(node) {
        if (node.id) checkIdentifier(node.id);
        checkParams(node);
      },
      FunctionExpression: checkParams,
      ArrowFunctionExpression: checkParams,
      CatchClause(node) {
        if (node.param?.type === 'Identifier') checkIdentifier(node.param);
      },
      'Program:exit'() {
        const scopeManager = context.sourceCode.scopeManager;
        if (!scopeManager) return;
        for (const scope of scopeManager.scopes) {
          const groups = new Map<string, TSESLint.Scope.Variable[]>();
          for (const variable of scope.variables) {
            const key = variable.name.toLowerCase();
            const group = groups.get(key);
            if (group) {
              group.push(variable);
            } else {
              groups.set(key, [variable]);
            }
          }
          for (const group of groups.values()) {
            const names = [...new Set(group.map(variable => variable.name))];
            if (names.length < 2) continue;
            for (const variable of group) {
              const definition = variable.defs[0];
              if (!definition) continue;
              const other = names
                .filter(name => name !== variable.name)
                .sort()
                .join(', ');
              context.report({
                node: definition.name,
                messageId: 'confusableNames',
                data: { name: variable.name, other },
              });
            }
          }
        }
      },
    };
  },
});
