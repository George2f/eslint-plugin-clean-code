import { writeFileSync } from 'node:fs';
import plugin from '../dist/index.js';

const recommended = new Set(Object.keys(plugin.configs.recommended.rules));

const catalog = {
  name: plugin.meta.name,
  version: plugin.meta.version,
  configs: {
    recommended: Object.keys(plugin.configs.recommended.rules),
    strict: Object.keys(plugin.configs.strict.rules),
  },
  rules: Object.entries(plugin.rules).map(([name, rule]) => ({
    name,
    cleanCodeId: rule.meta.docs.cleanCodeId,
    cleanCodeRule: rule.meta.docs.cleanCodeRule,
    description: rule.meta.docs.description,
    url: rule.meta.docs.url,
    tier: recommended.has(`clean-code/${name}`) ? 'static' : 'heuristic',
    fixable: rule.meta.fixable ?? false,
    hasSuggestions: rule.meta.hasSuggestions ?? false,
    defaultOptions: rule.defaultOptions ?? [],
    schema: rule.meta.schema ?? [],
  })),
};

const target = new URL('../dist/rules.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`catalog: wrote dist/rules.json (${catalog.rules.length} rules)`);
