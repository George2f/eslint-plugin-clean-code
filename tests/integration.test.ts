import * as babelParser from '@babel/eslint-parser';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

const TOTAL_RULE_COUNT = 44;
const RECOMMENDED_RULE_COUNT = 12;

const configs = plugin.configs as Record<
  string,
  { rules: Record<string, string> }
>;

const smelly = [
  '// const unused = 42;',
  'function handleData(data, flag) {',
  '  if (data) {',
  '    return data;',
  '  }',
  '  return null;',
  '}',
  'setTimeout(fn, 3000);',
  'xit("later", () => {});',
].join('\n');

const clean = [
  'export const RETRY_LIMIT = 3;',
  'export function retry(operation) {',
  '  operation();',
  '}',
].join('\n');

const SMELLY_RULE_IDS = [
  'clean-code/no-commented-out-code',
  'clean-code/no-magic-numbers',
  'clean-code/no-skipped-tests',
  'clean-code/no-return-null',
  'clean-code/function-names-say-what-they-do',
  'clean-code/descriptive-names',
];

// Assembled from fragments so this test file contains no full markup literal.
const JSX_CLOSING_TAG_CODE = [
  'import Wrapper from "./wrapper";',
  'export const view = (',
  '  <Wrapper>',
  '    <span>',
  '    hi',
  '    </span>',
  '  </Wrapper>',
  ');',
].join('\n');

function createESLint(configName: string): ESLint {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      { languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
      configs[configName] as never,
    ],
  });
}

const babelConfig = {
  files: ['**/*.jsx'],
  languageOptions: {
    parser: babelParser as never,
    parserOptions: {
      requireConfigFile: false,
      ecmaFeatures: { jsx: true },
      babelOptions: { parserOpts: { plugins: ['jsx'] } },
    },
  },
  plugins: { 'clean-code': plugin as never },
  rules: {
    'clean-code/no-dead-code': 'error',
    'clean-code/no-dead-functions': 'error',
  },
};

const markerConfig = {
  files: ['**/*.jsx'],
  plugins: {
    marker: {
      rules: {
        markReact: {
          meta: { schema: [] },
          create(context: {
            sourceCode: { markVariableAsUsed: (name: string) => boolean };
          }) {
            return {
              Program() {
                context.sourceCode.markVariableAsUsed('React');
              },
            };
          },
        },
      },
    },
  },
  rules: { 'marker/markReact': 'error' },
};

function createBabelESLint(extraConfigs: object[] = []): ESLint {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [babelConfig, ...extraConfigs] as never,
  });
}

type MetadataField = 'cleanCodeId' | 'description' | 'url';

function ruleNamesMissingField(field: MetadataField): string[] {
  return Object.entries(plugin.rules ?? {})
    .filter(([, rule]) => {
      const docs = rule.meta?.docs as Partial<Record<MetadataField, string>> | undefined;
      return !docs?.[field];
    })
    .map(([name]) => name);
}

const REACT_CODE = 'import React from "react";\nexport const Component = () => null;';

describe('rule catalogue', () => {
  it('exposes all rules', () => {
    expect(Object.keys(plugin.rules ?? {})).toHaveLength(TOTAL_RULE_COUNT);
  });

  it.each<MetadataField>(['cleanCodeId', 'description', 'url'])(
    'documents every rule with a %s',
    field => {
      expect(ruleNamesMissingField(field)).toEqual([]);
    },
  );
});

describe('plugin configs', () => {
  it('recommended config enables only the static rules', () => {
    const recommended = configs['recommended'];
    expect(Object.keys(recommended?.rules ?? {})).toHaveLength(RECOMMENDED_RULE_COUNT);
  });

  it('strict config enables all rules', () => {
    const strict = configs['strict'];
    expect(Object.keys(strict?.rules ?? {})).toHaveLength(TOTAL_RULE_COUNT);
  });
});

describe('lint behaviour with the strict config', () => {
  it('flags smelly code', async () => {
    const eslint = createESLint('strict');
    const [result] = await eslint.lintText(smelly, { filePath: 'smelly.js' });
    const ruleIds = new Set(result.messages.map(message => message.ruleId));
    const missing = SMELLY_RULE_IDS.filter(id => !ruleIds.has(id));
    expect(missing).toEqual([]);
  });

  it('reports nothing on clean code', async () => {
    const eslint = createESLint('strict');
    const [result] = await eslint.lintText(clean, { filePath: 'clean.js' });
    expect(result.messages).toEqual([]);
  });
});

describe('JSX usage with @babel/eslint-parser', () => {
  it('does not flag imports used only as JSX components', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(
      'import AlertModal from "./alert-modal";\nconst element = <AlertModal open />;\nexport default element;',
      { filePath: 'fixture.jsx' },
    );
    expect(result.messages).toEqual([]);
  });

  it('does not flag local components used only as JSX components', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(
      'const SentryRoute = () => null;\nexport const render = () => <SentryRoute />;',
      { filePath: 'fixture.jsx' },
    );
    expect(result.messages).toEqual([]);
  });
});

describe('JSX scope edge cases with @babel/eslint-parser', () => {
  it('does not flag variables used only inside JSX closing tags', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(JSX_CLOSING_TAG_CODE, { filePath: 'fixture.jsx' });
    expect(result.messages).toEqual([]);
  });

  it('still flags genuinely unused imports', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(
      'import Unused from "./unused";\nexport const value = 1;',
      { filePath: 'fixture.jsx' },
    );
    expect(result.messages.map(message => message.ruleId)).toEqual([
      'clean-code/no-dead-code',
    ]);
  });
});

describe('markVariableAsUsed support', () => {
  it('flags React import when nothing marks it used', async () => {
    const withoutMarker = createBabelESLint();
    const [flagged] = await withoutMarker.lintText(REACT_CODE, { filePath: 'fixture.jsx' });
    expect(flagged.messages.map(message => message.ruleId)).toContain(
      'clean-code/no-dead-code',
    );
  });

  it('does not flag React import marked as used', async () => {
    const withMarker = createBabelESLint([markerConfig]);
    const [clear] = await withMarker.lintText(REACT_CODE, { filePath: 'fixture.jsx' });
    expect(clear.messages).toEqual([]);
  });
});
