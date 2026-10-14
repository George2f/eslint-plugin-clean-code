import type { TSESTree } from '@typescript-eslint/utils';
import { isBooleanLiteral } from '../utils/ast';
import { createRule } from '../utils/create-rule';

function getParamTypeAnnotation(param: TSESTree.Parameter): TSESTree.TSTypeAnnotation | undefined {
  if (param.type === 'Identifier') return param.typeAnnotation;
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
    return param.left.typeAnnotation;
  }
  if (param.type === 'TSParameterProperty') return getParamTypeAnnotation(param.parameter);
  return undefined;
}

function getParamName(param: TSESTree.Parameter): string | undefined {
  if (param.type === 'Identifier') return param.name;
  if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') return param.left.name;
  if (param.type === 'TSParameterProperty') return getParamName(param.parameter);
  return undefined;
}

export default createRule({
  name: 'no-flag-arguments',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow boolean flag parameters that make a function do more than one thing (Clean Code F3)',
      cleanCodeId: 'F3',
      cleanCodeRule: 'Flag Arguments',
    },
    messages: {
      flagArgument:
        'Parameter "{{name}}" is a flag argument. Split the function into two clearly named functions (Clean Code F3).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkParam(param: TSESTree.Parameter): void {
      const name = getParamName(param);
      if (!name) return;
      const typeAnnotation = getParamTypeAnnotation(param);
      const isBooleanType = typeAnnotation?.typeAnnotation.type === 'TSBooleanKeyword';
      const isBooleanDefault =
        param.type === 'AssignmentPattern' && isBooleanLiteral(param.right);
      if (isBooleanType || isBooleanDefault) {
        context.report({ node: param, messageId: 'flagArgument', data: { name } });
      }
    }
    function check(node: TSESTree.FunctionLike): void {
      for (const param of node.params) checkParam(param);
    }
    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
});
