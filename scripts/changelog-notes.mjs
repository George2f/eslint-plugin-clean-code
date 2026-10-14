import { readFileSync } from 'node:fs';

const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const heading = `## [${packageJson.version}]`;
const start = changelog.indexOf(heading);

if (start === -1) {
  console.error(`changelog-notes: no CHANGELOG.md section for ${packageJson.version}`);
  process.exit(1);
}

const remainder = changelog
  .slice(start + heading.length)
  .replace(/^\s*-\s*\d{4}-\d{2}-\d{2}\s*/, '');
const nextSection = remainder.indexOf('\n## [');
const body = (nextSection === -1 ? remainder : remainder.slice(0, nextSection)).trim();

console.log(body);
