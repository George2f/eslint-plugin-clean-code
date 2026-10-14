import type { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { getPropertyName, walk } from '../utils/ast';
import type { VisitorKeys } from '../utils/ast';

function getSuperName(node: TSESTree.ClassDeclaration): string | undefined {
  const superClass = node.superClass;
  if (!superClass) return undefined;
  if (superClass.type === 'Identifier') return superClass.name;
  if (superClass.type === 'MemberExpression') return getPropertyName(superClass.property);
  return undefined;
}

type NamedMember = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

function isNamedMember(member: TSESTree.ClassElement): member is NamedMember {
  if (member.type !== 'MethodDefinition' && member.type !== 'PropertyDefinition') return false;
  return member.key.type !== 'PrivateIdentifier';
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
      'Program:exit'() {
        const sourceCode = context.sourceCode;
        const visitorKeys = sourceCode.visitorKeys as VisitorKeys;
        const classes = new Map<string, TSESTree.ClassDeclaration>();
        walk(sourceCode.ast, visitorKeys, node => {
          if (node.type === 'ClassDeclaration' && node.id) {
            classes.set(node.id.name, node);
          }
        });
        for (const [name, node] of classes) {
          const superName = getSuperName(node);
          if (!superName || !classes.has(superName)) continue;
          const ancestorStatics = new Set<string>();
          const visited = new Set<string>();
          let currentName: string | undefined = superName;
          while (currentName && !visited.has(currentName)) {
            visited.add(currentName);
            const ancestor = classes.get(currentName);
            if (!ancestor) break;
            for (const memberName of getStaticMemberNames(ancestor)) {
              ancestorStatics.add(memberName);
            }
            currentName = getSuperName(ancestor);
          }
          if (ancestorStatics.size === 0) continue;
          const ownMembers = getOwnMemberNames(node);
          walk(node, visitorKeys, current => {
            if (current.type !== 'MemberExpression') return;
            const object = current.object;
            const isSubclassReference =
              object.type === 'Super' ||
              object.type === 'ThisExpression' ||
              (object.type === 'Identifier' && object.name === name);
            if (!isSubclassReference) return;
            const propertyName = getPropertyName(current.property);
            if (!propertyName || !ancestorStatics.has(propertyName)) return;
            if (ownMembers.has(propertyName)) return;
            context.report({
              node: current,
              messageId: 'inheritedConstant',
              data: { name: propertyName, base: superName },
            });
          });
        }
      },
    };
  },
});
