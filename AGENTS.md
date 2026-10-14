# AGENTS.md

Guidance for coding agents working in this repository.

## What this repo is

`@george2f/eslint-plugin-clean-code` — 44 ESLint rules derived from Clean Code (Robert C. Martin). Zero runtime dependencies: everything, including the bundled `espree` (used to detect commented-out code), is inlined into `dist/`.

## Commands

- `npm test` — vitest + ESLint RuleTester (44 rule suites + integration test)
- `npm run lint` — `tsc --noEmit`, then builds, then lints the repo with the plugin itself (strict preset, every rule at error)
- `npm run build` — tsup → `dist/index.js` + `dist/index.cjs` + `dist/index.d.ts` (minified, no source maps), then the postbuild CJS interop patch and `dist/rules.json` catalog
- `npm run verify:dist` — checks the built bundles (44 rules, configs, `meta.name`)
- `npm run typecheck` — `tsc --noEmit` alone

## Architecture

- `src/rules/<rule>.ts` — one rule per file with a colocated `.test.ts`
- `src/utils/create-rule.ts` — rule factory: merges partial options with defaults (`applyDefault`), attaches `meta.docs.url`, `cleanCodeId`, `cleanCodeRule`
- `src/index.ts` — rule registry plus `recommended` (12 static rules, error), `strict` (all 44; static error, heuristic warn) and `strictest` (all 44, all error) flat configs; `meta.name`/`meta.version` are read from `package.json` — never hardcode them
- `src/utils/` — AST, scope, naming and comment helpers; `src/test-utils/rule-tester.ts` — RuleTester wired to vitest

## Adding a rule

1. Create `src/rules/<kebab-name>.ts` using `createRule({ name, meta: { type, docs: { description, cleanCodeId, cleanCodeRule }, messages, schema }, defaultOptions, create })`
2. Add a colocated test using `ruleTester` from `../test-utils/rule-tester`
3. Register the rule in `src/index.ts` and add it to `recommendedRules` (static) or `heuristicRules` (heuristic)
4. Update the README tables (Options, chapter mapping, autofix/overlap where relevant) and `CHANGELOG.md` under Unreleased
5. Run `npm test` and `npm run lint`

## Gotchas

- The repo lints itself with the plugin at error severity. `npm run lint` rebuilds `dist` first because `eslint.config.mjs` imports the built plugin — a broken build breaks linting
- Tests import `src`, not `dist`. Run `npm run verify:dist` after any build-related change (the output is minified)
- The `it` entry in `long-names-for-long-scopes` defaults is an intentional test-framework exception
- Version lives in `package.json` only; `src/index.ts` reads it at build time
- Releases go through git tags and `.github/workflows/release.yml` (npm trusted publishing / OIDC). Do not `npm publish` from a laptop unless bootstrapping the very first version

## Conventions

- No comments unless they explain something the code cannot; rule messages end with the book reference, e.g. `(Clean Code F1)`
- `@typescript-eslint/utils` is imported type-only; all runtime code is ours or bundled
