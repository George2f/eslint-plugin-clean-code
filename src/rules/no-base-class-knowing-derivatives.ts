import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getPropertyName, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type MessageIds = 'baseClassKnowsDerivative';
type BaseClassContext = TSESLint.RuleContext<MessageIds, never[]>;

interface ClassInfo {
  node: TSESTree.ClassDeclaration;
  superName: string | undefined;
}

interface BaseClassScan {
  node: TSESTree.ClassDeclaration;
  name: string;
  subclassNames: Set<string>;
}

function superNameOf(node: TSESTree.ClassDeclaration): string | undefined {
  const superClass = node.superClass;
  if (!superClass) return undefined;
  if (superClass.type === 'Identifier') return superClass.name;
  if (superClass.type === 'MemberExpression') return getPropertyName(superClass.property);
  return undefined;
}

function buildDerivatives(classes: Map<string, ClassInfo>): Map<string, Set<string>> {
  const derivatives = new Map<string, Set<string>>();
  for (const [name, info] of classes) {
    if (!info.superName) continue;
    const current = derivatives.get(info.superName) ?? new Set<string>();
    current.add(name);
    derivatives.set(info.superName, current);
  }
  return derivatives;
}

function reportDerivativeReferences(
  context: BaseClassContext,
  scan: BaseClassScan,
  visitorKeys: VisitorKeys,
): void {
  walk(scan.node, visitorKeys, current => {
    if (current.type !== 'Identifier') return;
    if (current.name === scan.name) return;
    if (!scan.subclassNames.has(current.name)) return;
    context.report({
      node: current,
      messageId: 'baseClassKnowsDerivative',
      data: { name: scan.name, derivative: current.name },
    });
  });
}

function reportBaseClassReferences(
  context: BaseClassContext,
  classes: Map<string, ClassInfo>,
  visitorKeys: VisitorKeys,
): void {
  const derivatives = buildDerivatives(classes);
  for (const [name, info] of classes) {
    const subclassNames = derivatives.get(name);
    if (!subclassNames || subclassNames.size === 0) continue;
    reportDerivativeReferences(context, { node: info.node, name, subclassNames }, visitorKeys);
  }
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
        const { id } = node;
        if (!id) return;
        const classInfo: ClassInfo = { node, superName: superNameOf(node) };
        classes.set(id.name, classInfo);
      },
      'Program:exit': () => reportBaseClassReferences(context, classes, visitorKeys),
    };
  },
});
