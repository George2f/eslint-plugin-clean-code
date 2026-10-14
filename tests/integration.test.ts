import * as babelParser from '@babel/eslint-parser';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import plugin from '../src/index';

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

describe('plugin integration', () => {
  it('exposes all 44 rules with book metadata', () => {
    const entries = Object.entries(plugin.rules ?? {});
    expect(entries).toHaveLength(44);
    for (const [name, rule] of entries) {
      const docs = rule.meta?.docs as
        | { cleanCodeId?: string; description?: string; url?: string }
        | undefined;
      expect(docs?.cleanCodeId, name).toBeTruthy();
      expect(docs?.description, name).toBeTruthy();
      expect(docs?.url, name).toBeTruthy();
    }
  });

  it('recommended config enables 12 rules, strict enables all 44', () => {
    expect(Object.keys(configs['recommended']?.rules ?? {})).toHaveLength(12);
    expect(Object.keys(configs['strict']?.rules ?? {})).toHaveLength(44);
  });

  it('flags smelly code with the strict config', async () => {
    const eslint = createESLint('strict');
    const [result] = await eslint.lintText(smelly, { filePath: 'smelly.js' });
    const ruleIds = new Set(result.messages.map(message => message.ruleId));
    expect(ruleIds).toContain('clean-code/no-commented-out-code');
    expect(ruleIds).toContain('clean-code/no-magic-numbers');
    expect(ruleIds).toContain('clean-code/no-skipped-tests');
    expect(ruleIds).toContain('clean-code/no-return-null');
    expect(ruleIds).toContain('clean-code/function-names-say-what-they-do');
    expect(ruleIds).toContain('clean-code/descriptive-names');
  });

  it('reports nothing on clean code with the strict config', async () => {
    const eslint = createESLint('strict');
    const [result] = await eslint.lintText(clean, { filePath: 'clean.js' });
    expect(result.messages).toEqual([]);
  });
});

describe('JSX usage with @babel/eslint-parser (JSX creates no scope references)', () => {
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

  it('does not flag variables used only inside JSX closing tags', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(
      'import Wrapper from "./wrapper";\nexport const view = (\n  <Wrapper>\n    <span>hi</span>\n  </Wrapper>\n);',
      { filePath: 'fixture.jsx' },
    );
    expect(result.messages).toEqual([]);
  });

  it('still flags genuinely unused imports', async () => {
    const eslint = createBabelESLint();
    const [result] = await eslint.lintText(
      'import Unused from "./unused";\nexport const value = 1;',
      { filePath: 'fixture.jsx' },
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.ruleId).toBe('clean-code/no-dead-code');
  });

  it('honours markVariableAsUsed (react/jsx-uses-react style usage)', async () => {
    const code = 'import React from "react";\nexport const Component = () => null;';
    const withoutMarker = createBabelESLint();
    const [flagged] = await withoutMarker.lintText(code, { filePath: 'fixture.jsx' });
    expect(flagged.messages.map(message => message.ruleId)).toContain(
      'clean-code/no-dead-code',
    );

    const withMarker = createBabelESLint([markerConfig]);
    const [clean] = await withMarker.lintText(code, { filePath: 'fixture.jsx' });
    expect(clean.messages).toEqual([]);
  });
});
