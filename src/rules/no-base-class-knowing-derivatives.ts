import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getPropertyName, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

interface ClassInfo {
  node: TSESTree.ClassDeclaration;
  superName: string | undefined;
}

export default createRule({
  name: 'no-base-class-knowing-derivatives',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow base classes referencing their own derivatives (Clean Code G7)',
      cleanCodeId: 'G7',
      cleanCodeRule: 'Base Classes Depending on Their Derivatives',
    },
    messages: {
      baseClassKnowsDerivative:
        'Base class {{name}} references its derivative {{derivative}}; invert the dependency (Clean Code G7).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const visitorKeys = context.sourceCode.visitorKeys as VisitorKeys;
    const classes = new Map<string, ClassInfo>();

    return {
      ClassDeclaration(node) {
        if (!node.id) return;
        const superClass = node.superClass;
        let superName: string | undefined;
        if (superClass) {
          if (superClass.type === 'Identifier') {
            superName = superClass.name;
          } else if (superClass.type === 'MemberExpression') {
            superName = getPropertyName(superClass.property);
          }
        }
        classes.set(node.id.name, { node, superName });
      },
      'Program:exit'() {
        const derivatives = new Map<string, Set<string>>();
        for (const [name, info] of classes) {
          if (!info.superName) continue;
          const current = derivatives.get(info.superName) ?? new Set<string>();
          current.add(name);
          derivatives.set(info.superName, current);
        }
        for (const [name, info] of classes) {
          const subclassNames = derivatives.get(name);
          if (!subclassNames || subclassNames.size === 0) continue;
          walk(info.node, visitorKeys, current => {
            if (
              current.type === 'Identifier' &&
              current.name !== name &&
              subclassNames.has(current.name)
            ) {
              context.report({
                node: current,
                messageId: 'baseClassKnowsDerivative',
                data: { name, derivative: current.name },
              });
            }
          });
        }
      },
    };
  },
});
