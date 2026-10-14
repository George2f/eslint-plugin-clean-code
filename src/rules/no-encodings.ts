import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getParamIdentifier } from '../utils/ast';
import type { FunctionNode } from '../utils/ast';

const ENCODING_PATTERNS = [
  /^[mgs]_/,
  /^(?:str|arr|obj|num|int|bool|bln|flt|dbl|chr|fn|fnc|func|ptr)[A-Z]/,
];

const TYPE_PREFIX_PATTERN = /^I[A-Z][a-z]/;

export default createRule({
  name: 'no-encodings',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow encoded names such as Hungarian notation prefixes (Clean Code N6)',
      cleanCodeId: 'N6',
      cleanCodeRule: 'Avoid Encodings',
    },
    messages: {
      encodedName:
        'Name "{{name}}" is encoded with a type or scope prefix; remove the encoding (Clean Code N6).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          patterns: { type: 'array', items: { type: 'string' } },
          typePrefixes: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ patterns: [] as string[], typePrefixes: false }],
  create(context, [options]) {
    const userPatterns = options.patterns.flatMap(source => {
      try {
        return [new RegExp(source)];
      } catch {
        return [];
      }
    });

    function isEncoded(name: string): boolean {
      if (ENCODING_PATTERNS.some(pattern => pattern.test(name))) return true;
      return userPatterns.some(pattern => pattern.test(name));
    }

    function checkIdentifier(identifier: TSESTree.Identifier): void {
      if (!isEncoded(identifier.name)) return;
      context.report({
        node: identifier,
        messageId: 'encodedName',
        data: { name: identifier.name },
      });
    }

    function checkParams(node: FunctionNode): void {
      for (const param of node.params) {
        const identifier = getParamIdentifier(param);
        if (identifier) checkIdentifier(identifier);
      }
    }

    function checkTypePrefix(identifier: TSESTree.Identifier): void {
      if (!options.typePrefixes) return;
      if (!TYPE_PREFIX_PATTERN.test(identifier.name)) return;
      context.report({
        node: identifier,
        messageId: 'encodedName',
        data: { name: identifier.name },
      });
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
      ClassDeclaration(node) {
        if (node.id) checkIdentifier(node.id);
      },
      CatchClause(node) {
        if (node.param && node.param.type === 'Identifier') checkIdentifier(node.param);
      },
      TSInterfaceDeclaration(node) {
        checkTypePrefix(node.id);
      },
      TSTypeAliasDeclaration(node) {
        checkTypePrefix(node.id);
      },
    };
  },
});
