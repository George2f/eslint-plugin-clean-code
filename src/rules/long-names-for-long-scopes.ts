import { createRule } from '../utils/create-rule';

const CHECKED_DEFINITION_TYPES = ['Variable', 'FunctionName', 'ClassName', 'ImportBinding'];

export default createRule({
  name: 'long-names-for-long-scopes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require long names for long scopes (Clean Code N5)',
      cleanCodeId: 'N5',
      cleanCodeRule: 'Use Long Names for Long Scopes',
    },
    messages: {
      shortNameInLongScope:
        'Name "{{name}}" is too short for a long scope; use a longer, descriptive name (Clean Code N5).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minLength: { type: 'integer', minimum: 0 },
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minLength: 3, allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_'] }],
  create(context, [options]) {
    return {
      'Program:exit'() {
        const scopeManager = context.sourceCode.scopeManager;
        if (!scopeManager) return;
        const scope =
          scopeManager.scopes.find(candidate => candidate.type === 'module') ??
          scopeManager.globalScope;
        if (!scope) return;
        for (const variable of scope.variables) {
          const definition = variable.defs[0];
          if (!definition) continue;
          if (!CHECKED_DEFINITION_TYPES.includes(definition.type)) continue;
          const identifier = definition.name;
          if (!identifier || identifier.type !== 'Identifier') continue;
          const name = identifier.name;
          if (name.length >= options.minLength) continue;
          if (options.allow.includes(name)) continue;
          if (name.startsWith('_')) continue;
          context.report({
            node: identifier,
            messageId: 'shortNameInLongScope',
            data: { name },
          });
        }
      },
    };
  },
});
