import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CJS = require('../dist/index.cjs');
const ESM = (await import('../dist/index.js')).default;

const EXPECTED_RULE_COUNT = 44;
const EXPECTED_NAME = '@george2f/eslint-plugin-clean-code';

for (const [format, plugin] of [
  ['cjs', CJS],
  ['esm', ESM],
]) {
  const ruleCount = Object.keys(plugin.rules ?? {}).length;
  if (ruleCount !== EXPECTED_RULE_COUNT) {
    throw new Error(`${format}: expected ${EXPECTED_RULE_COUNT} rules, found ${ruleCount}`);
  }
  if (!plugin.configs?.recommended || !plugin.configs?.strict) {
    throw new Error(`${format}: missing recommended/strict configs`);
  }
  if (plugin.meta?.name !== EXPECTED_NAME) {
    throw new Error(`${format}: meta.name is "${plugin.meta?.name}", expected "${EXPECTED_NAME}"`);
  }
}

console.log(`verify-dist: cjs + esm ok (${EXPECTED_RULE_COUNT} rules, 2 configs)`);
