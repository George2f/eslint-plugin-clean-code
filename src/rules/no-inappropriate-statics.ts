import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';

export default createRule({
  name: 'no-inappropriate-statics',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow classes with only static members; prefer plain module functions (Clean Code G18)',
      cleanCodeId: 'G18',
      cleanCodeRule: 'Inappropriate Static',
    },
    messages: {
      allStaticClass:
        'Class {{name}} has only static members; use plain module functions instead (Clean Code G18).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function check(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): void {
      const members = node.body.body.filter(
        member => member.type === 'MethodDefinition' || member.type === 'PropertyDefinition',
      );
      if (members.length === 0) return;
      if (!members.every(member => member.static)) return;
      context.report({
        node,
        messageId: 'allStaticClass',
        data: { name: node.id?.name ?? '<anonymous>' },
      });
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
});
