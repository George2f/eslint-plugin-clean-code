import type { TSESLint } from '@typescript-eslint/utils';

export interface CleanCodeDocs {
  cleanCodeId: string;
  cleanCodeRule: string;
  description: string;
  url: string;
}

interface CleanCodeMeta<TMessageIds extends string> {
  type: 'problem' | 'suggestion' | 'layout';
  docs: Omit<CleanCodeDocs, 'url'>;
  messages: Record<TMessageIds, string>;
  schema: readonly unknown[];
  fixable?: 'code' | 'whitespace';
  hasSuggestions?: boolean;
  deprecated?: boolean;
}

interface RuleConfig<TOptions extends readonly unknown[], TMessageIds extends string> {
  name: string;
  meta: CleanCodeMeta<TMessageIds>;
  defaultOptions: TOptions;
  create: (
    context: TSESLint.RuleContext<TMessageIds, TOptions>,
    options: TOptions,
  ) => TSESLint.RuleListener;
}

function isObjectNotArray(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    result[key] =
      isObjectNotArray(baseValue) && isObjectNotArray(value)
        ? deepMerge(baseValue, value)
        : value;
  }
  return result;
}

function applyDefault(defaults: readonly unknown[], userOptions: readonly unknown[]): unknown[] {
  const result = structuredClone(defaults) as unknown[];
  for (let index = 0; index < result.length; index += 1) {
    const userOption = userOptions[index];
    if (userOption === undefined) continue;
    const baseOption = result[index];
    result[index] =
      isObjectNotArray(baseOption) && isObjectNotArray(userOption)
        ? deepMerge(baseOption, userOption)
        : userOption;
  }
  return result;
}

export function createRule<TOptions extends readonly unknown[], TMessageIds extends string>(
  config: RuleConfig<TOptions, TMessageIds>,
): TSESLint.RuleModule<TMessageIds, TOptions, CleanCodeDocs> {
  const url = 'https://github.com/George2f/eslint-plugin-clean-code#options';
  const rule = {
    meta: {
      ...config.meta,
      docs: { ...config.meta.docs, url },
    },
    defaultOptions: config.defaultOptions,
    create(context: TSESLint.RuleContext<TMessageIds, TOptions>): TSESLint.RuleListener {
      const options = applyDefault(
        config.defaultOptions,
        context.options ?? [],
      ) as unknown as TOptions;
      return config.create(context, options);
    },
  };
  return rule as unknown as TSESLint.RuleModule<TMessageIds, TOptions, CleanCodeDocs>;
}
