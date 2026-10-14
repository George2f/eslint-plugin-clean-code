import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getPropertyName, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

type MessageIds = 'inheritedConstant';
type InheritedConstantsContext = TSESLint.RuleContext<MessageIds, never[]>;

interface ClassTarget {
  name: string;
  node: TSESTree.ClassDeclaration;
}

interface ClassCheck extends ClassTarget {
  superName: string;
  ancestorStatics: Set<string>;
  ownMembers: Set<string>;
}

type NamedMember = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

function isNamedMember(member: TSESTree.ClassElement): member is NamedMember {
  if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') return false;
  return member.key.type !== 'PrivateIdentifier';
}

function getSuperName(node: TSESTree.ClassDeclaration): string | undefined {
  const superClass = node.superClass;
  if (!superClass) return undefined;
  if (superClass.type === 'Identifier') return superClass.name;
  if (superClass.type === 'MemberExpression') return getPropertyName(superClass.property);
  return undefined;
}

function getStaticMemberNames(node: TSESTree.ClassDeclaration): Set<string> {
  const names = new Set<string>();
  for (const member of node.body.body) {
    if (!isNamedMember(member) || !member.static) continue;
    const name = getPropertyName(member.key);
    if (name) names.add(name);
  }
  return names;
}

function getOwnMemberNames(node: TSESTree.ClassDeclaration): Set<string> {
  const names = new Set<string>();
  for (const member of node.body.body) {
    if (!isNamedMember(member)) continue;
    const name = getPropertyName(member.key);
    if (name) names.add(name);
  }
  return names;
}

function collectClasses(
  sourceCode: TSESLint.SourceCode,
): Map<string, TSESTree.ClassDeclaration> {
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  const classes = new Map<string, TSESTree.ClassDeclaration>();
  walk(sourceCode.ast, visitorKeys, node => {
    if (node.type !== 'ClassDeclaration' || !node.id) return;
    classes.set(node.id.name, node);
  });
  return classes;
}

function collectAncestorStatics(
  startName: string,
  classes: Map<string, TSESTree.ClassDeclaration>,
): Set<string> {
  const ancestorStatics = new Set<string>();
  const visited = new Set<string>();
  let currentName: string | undefined = startName;
  while (currentName && !visited.has(currentName)) {
    visited.add(currentName);
    const ancestor = classes.get(currentName);
    if (!ancestor) break;
    for (const memberName of getStaticMemberNames(ancestor)) {
      ancestorStatics.add(memberName);
    }
    currentName = getSuperName(ancestor);
  }
  return ancestorStatics;
}

function isSubclassReference(object: TSESTree.Node, className: string): boolean {
  if (object.type === 'Super') return true;
  if (object.type === 'ThisExpression') return true;
  return object.type === 'Identifier' && object.name === className;
}

function reportInheritedReferences(
  context: InheritedConstantsContext,
  check: ClassCheck,
  visitorKeys: VisitorKeys,
): void {
  walk(check.node, visitorKeys, current => {
    if (current.type !== 'MemberExpression') return;
    if (!isSubclassReference(current.object, check.name)) return;
    const propertyName = getPropertyName(current.property);
    if (!propertyName || !check.ancestorStatics.has(propertyName)) return;
    if (check.ownMembers.has(propertyName)) return;
    context.report({
      node: current,
      messageId: 'inheritedConstant',
      data: { name: propertyName, base: check.superName },
    });
  });
}

function scanClass(
  context: InheritedConstantsContext,
  target: ClassTarget,
  classes: Map<string, TSESTree.ClassDeclaration>,
  visitorKeys: VisitorKeys,
): void {
  const superName = getSuperName(target.node);
  if (!superName || !classes.has(superName)) return;
  const ancestorStatics = collectAncestorStatics(superName, classes);
  if (ancestorStatics.size === 0) return;
  const ownMembers = getOwnMemberNames(target.node);
  reportInheritedReferences(
    context,
    { ...target, superName, ancestorStatics, ownMembers },
    visitorKeys,
  );
}

function scanClasses(context: InheritedConstantsContext): void {
  const sourceCode = context.sourceCode;
  const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
  const classes = collectClasses(sourceCode);
  for (const [name, node] of classes) {
    scanClass(context, { name, node }, classes, visitorKeys);
  }
}

export default createRule({
  name: 'no-inherited-constants',
  meta: {
    type: 'suggestion',
    docs: {
      description: "Disallow referencing inherited constants through the subclass (Clean Code J2)",
      cleanCodeId: 'J2',
      cleanCodeRule: "Don't Inherit Constants",
    },
    messages: {
      inheritedConstant:
        'Constant "{{name}}" is inherited from {{base}}; reference {{base}}.{{name}} directly instead of hiding its origin (Clean Code J2).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      'Program:exit': () => scanClasses(context),
    };
  },
});
