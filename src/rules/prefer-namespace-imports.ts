import { createRule } from '../utils/create-rule';

export default createRule({
  name: 'prefer-namespace-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Avoid long import lists by using wildcards (Clean Code J1)',
      cleanCodeId: 'J1',
      cleanCodeRule: 'Avoid Long Import Lists by Using Wildcards',
    },
    messages: {
      longImportList:
        'Import declaration lists {{count}} named imports from "{{source}}"; the maximum is {{max}}. Use a namespace import instead (Clean Code J1).',
    },
    schema: [
      {
        type: 'object',
        properties: { maxNamedImports: { type: 'integer', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ maxNamedImports: 10 }],
  create(context, [options]) {
    return {
      ImportDeclaration(node) {
        const count = node.specifiers.filter(
          specifier => specifier.type === 'ImportSpecifier',
        ).length;
        if (count <= options.maxNamedImports) return;
        context.report({
          node,
          messageId: 'longImportList',
          data: {
            count,
            max: options.maxNamedImports,
            source: String(node.source.value),
          },
        });
      },
    };
  },
});
