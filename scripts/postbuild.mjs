import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../dist/index.cjs', import.meta.url);
const marker = 'module.exports = module.exports.default;';
const source = readFileSync(file, 'utf8');

if (!source.includes(marker)) {
  writeFileSync(file, `${source}\n${marker}\n`);
  console.log('postbuild: applied CJS default export interop to dist/index.cjs');
} else {
  console.log('postbuild: CJS default export interop already present');
}
