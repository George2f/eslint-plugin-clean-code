import type { ESLint } from 'eslint';

import packageJson from '../package.json';
import bePrecise from './rules/be-precise';
import commandQuerySeparation from './rules/command-query-separation';
import declarationProximity from './rules/declaration-proximity';
import descriptiveNames from './rules/descriptive-names';
import encapsulateBoundaries from './rules/encapsulate-boundaries';
import encapsulateConditionals from './rules/encapsulate-conditionals';
import functionDoesOneThing from './rules/function-does-one-thing';
import functionNamesSayWhatTheyDo from './rules/function-names-say-what-they-do';
import lawOfDemeter from './rules/law-of-demeter';
import limitedPublicApi from './rules/limited-public-api';
import longNamesForLongScopes from './rules/long-names-for-long-scopes';
import maxArguments from './rules/max-arguments';
import namesDescribeSideEffects from './rules/names-describe-side-effects';
import noAmbiguousNames from './rules/no-ambiguous-names';
import noBaseClassKnowingDerivatives from './rules/no-base-class-knowing-derivatives';
import noClutter from './rules/no-clutter';
import noCommentedOutCode from './rules/no-commented-out-code';
import noDeadCode from './rules/no-dead-code';
import noDeadFunctions from './rules/no-dead-functions';
import noDuplication from './rules/no-duplication';
import noEncodings from './rules/no-encodings';
import noFeatureEnvy from './rules/no-feature-envy';
import noFlagArguments from './rules/no-flag-arguments';
import noInappropriateComments from './rules/no-inappropriate-comments';
import noInappropriateStatics from './rules/no-inappropriate-statics';
import noInheritedConstants from './rules/no-inherited-constants';
import noMagicNumbers from './rules/no-magic-numbers';
import noMultipleLanguages from './rules/no-multiple-languages';
import noNegativeConditionals from './rules/no-negative-conditionals';
import noObscuredIntent from './rules/no-obscured-intent';
import noOutputArguments from './rules/no-output-arguments';
import noOverriddenSafeties from './rules/no-overridden-safeties';
import noPassNull from './rules/no-pass-null';
import noRedundantComments from './rules/no-redundant-comments';
import noReturnNull from './rules/no-return-null';
import noSelectorArguments from './rules/no-selector-arguments';
import noSkippedTests from './rules/no-skipped-tests';
import noTodoTests from './rules/no-todo-tests';
import oneAssertionPerTest from './rules/one-assertion-per-test';
import oneLevelOfAbstraction from './rules/one-level-of-abstraction';
import preferExceptionsOverErrorCodes from './rules/prefer-exceptions-over-error-codes';
import preferNamespaceImports from './rules/prefer-namespace-imports';
import preferPolymorphism from './rules/prefer-polymorphism';
import useExplanatoryVariables from './rules/use-explanatory-variables';

const rules = {
  'be-precise': bePrecise,
  'command-query-separation': commandQuerySeparation,
  'declaration-proximity': declarationProximity,
  'descriptive-names': descriptiveNames,
  'encapsulate-boundaries': encapsulateBoundaries,
  'encapsulate-conditionals': encapsulateConditionals,
  'function-does-one-thing': functionDoesOneThing,
  'function-names-say-what-they-do': functionNamesSayWhatTheyDo,
  'law-of-demeter': lawOfDemeter,
  'limited-public-api': limitedPublicApi,
  'long-names-for-long-scopes': longNamesForLongScopes,
  'max-arguments': maxArguments,
  'names-describe-side-effects': namesDescribeSideEffects,
  'no-ambiguous-names': noAmbiguousNames,
  'no-base-class-knowing-derivatives': noBaseClassKnowingDerivatives,
  'no-clutter': noClutter,
  'no-commented-out-code': noCommentedOutCode,
  'no-dead-code': noDeadCode,
  'no-dead-functions': noDeadFunctions,
  'no-duplication': noDuplication,
  'no-encodings': noEncodings,
  'no-feature-envy': noFeatureEnvy,
  'no-flag-arguments': noFlagArguments,
  'no-inappropriate-comments': noInappropriateComments,
  'no-inappropriate-statics': noInappropriateStatics,
  'no-inherited-constants': noInheritedConstants,
  'no-magic-numbers': noMagicNumbers,
  'no-multiple-languages': noMultipleLanguages,
  'no-negative-conditionals': noNegativeConditionals,
  'no-obscured-intent': noObscuredIntent,
  'no-output-arguments': noOutputArguments,
  'no-overridden-safeties': noOverriddenSafeties,
  'no-pass-null': noPassNull,
  'no-redundant-comments': noRedundantComments,
  'no-return-null': noReturnNull,
  'no-selector-arguments': noSelectorArguments,
  'no-skipped-tests': noSkippedTests,
  'no-todo-tests': noTodoTests,
  'one-assertion-per-test': oneAssertionPerTest,
  'one-level-of-abstraction': oneLevelOfAbstraction,
  'prefer-exceptions-over-error-codes': preferExceptionsOverErrorCodes,
  'prefer-namespace-imports': preferNamespaceImports,
  'prefer-polymorphism': preferPolymorphism,
  'use-explanatory-variables': useExplanatoryVariables,
};

const recommendedRules: Record<string, 'error'> = {
  'clean-code/max-arguments': 'error',
  'clean-code/no-commented-out-code': 'error',
  'clean-code/no-dead-code': 'error',
  'clean-code/no-encodings': 'error',
  'clean-code/no-flag-arguments': 'error',
  'clean-code/no-magic-numbers': 'error',
  'clean-code/no-negative-conditionals': 'error',
  'clean-code/no-overridden-safeties': 'error',
  'clean-code/no-pass-null': 'error',
  'clean-code/no-return-null': 'error',
  'clean-code/no-skipped-tests': 'error',
  'clean-code/no-todo-tests': 'error',
};

const heuristicRules: Record<string, 'warn'> = {
  'clean-code/be-precise': 'warn',
  'clean-code/command-query-separation': 'warn',
  'clean-code/declaration-proximity': 'warn',
  'clean-code/descriptive-names': 'warn',
  'clean-code/encapsulate-boundaries': 'warn',
  'clean-code/encapsulate-conditionals': 'warn',
  'clean-code/function-does-one-thing': 'warn',
  'clean-code/function-names-say-what-they-do': 'warn',
  'clean-code/law-of-demeter': 'warn',
  'clean-code/limited-public-api': 'warn',
  'clean-code/long-names-for-long-scopes': 'warn',
  'clean-code/names-describe-side-effects': 'warn',
  'clean-code/no-ambiguous-names': 'warn',
  'clean-code/no-base-class-knowing-derivatives': 'warn',
  'clean-code/no-clutter': 'warn',
  'clean-code/no-dead-functions': 'warn',
  'clean-code/no-duplication': 'warn',
  'clean-code/no-feature-envy': 'warn',
  'clean-code/no-inappropriate-comments': 'warn',
  'clean-code/no-inappropriate-statics': 'warn',
  'clean-code/no-inherited-constants': 'warn',
  'clean-code/no-multiple-languages': 'warn',
  'clean-code/no-obscured-intent': 'warn',
  'clean-code/no-output-arguments': 'warn',
  'clean-code/no-redundant-comments': 'warn',
  'clean-code/no-selector-arguments': 'warn',
  'clean-code/one-assertion-per-test': 'warn',
  'clean-code/one-level-of-abstraction': 'warn',
  'clean-code/prefer-exceptions-over-error-codes': 'warn',
  'clean-code/prefer-namespace-imports': 'warn',
  'clean-code/prefer-polymorphism': 'warn',
  'clean-code/use-explanatory-variables': 'warn',
};

const plugin: ESLint.Plugin = {
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: rules as unknown as ESLint.Plugin['rules'],
};

plugin.configs = {
  recommended: {
    name: 'clean-code/recommended',
    plugins: { 'clean-code': plugin },
    rules: recommendedRules,
  },
  strict: {
    name: 'clean-code/strict',
    plugins: { 'clean-code': plugin },
    rules: { ...recommendedRules, ...heuristicRules },
  },
};

export default plugin;
