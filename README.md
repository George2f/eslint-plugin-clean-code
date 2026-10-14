# eslint-plugin-clean-code

[![npm version](https://img.shields.io/npm/v/@george2f/eslint-plugin-clean-code)](https://www.npmjs.com/package/@george2f/eslint-plugin-clean-code)
[![CI](https://github.com/George2f/eslint-plugin-clean-code/actions/workflows/ci.yml/badge.svg)](https://github.com/George2f/eslint-plugin-clean-code/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@george2f/eslint-plugin-clean-code)](LICENSE)

ESLint rules derived from [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/) by Robert C. Martin.

Every rule maps to a numbered book rule (Chapter 17 "Smells and Heuristics", plus selected rules from Chapters 3, 7 and 9), and every reference is kept in the rule metadata (`meta.docs.cleanCodeId`), so a lint report points straight back to the book.

- 44 ESLint rules, one per book rule
- Chapters 17's 66 numbered heuristics: 39 automated, 27 documented as not statically detectable (see [Chapter 17 mapping](#chapter-17-smells-and-heuristics))
- ESLint 9 flat config, TypeScript-friendly, dual ESM/CJS build

## Why this exists

I wrote this plugin because I always wondered how hard it would be to follow all of the Clean Code rules. It turns out it is hard for humans and trivial for agents — so now, instead of you following the rules, your agents follow them for you. Point them at `strict`, or `strictest` if you are feeling brave, and they will write clean, consistent, heavily rule-bound code that would make even the lousiest bot cry tears of consistent and clean joy.

## Install

```sh
npm install --save-dev eslint @george2f/eslint-plugin-clean-code
```

Requires ESLint >= 8.57 (8.57, 9.x and 10.x are supported; zero runtime dependencies). The `configs.recommended` / `configs.strict` exports are flat-config objects; on legacy `.eslintrc` setups, register the plugin (`plugins: ['@george2f/clean-code']`) and enable rules manually.

## Usage

```js
// eslint.config.js
import cleanCode from '@george2f/eslint-plugin-clean-code';

export default [
  cleanCode.configs.recommended, // 12 high-confidence rules, all errors
  // cleanCode.configs.strict,     // all 44 rules; static = error, heuristic = warn
  // cleanCode.configs.strictest,  // all 44 rules at error, heuristics included
];
```

Or pick rules individually:

```js
import cleanCode from '@george2f/eslint-plugin-clean-code';

export default [
  {
    plugins: { 'clean-code': cleanCode },
    rules: {
      'clean-code/max-arguments': ['error', { max: 4 }],
      'clean-code/law-of-demeter': ['warn', { maxChainLength: 2 }],
    },
  },
];
```

### Configs

| Config | Rules | Severity | Intent |
|---|---|---|---|
| `clean-code/recommended` | 12 | `error` | Reliable AST detection, low false-positive rate |
| `clean-code/strict` | 44 | `error` static / `warn` heuristic | Everything, including opinionated heuristics |
| `clean-code/strictest` | 44 | `error` | Everything as an error, heuristics included; expect to tune options |

The 12 `recommended` rules: `max-arguments`, `no-commented-out-code`, `no-dead-code`, `no-encodings`, `no-flag-arguments`, `no-magic-numbers`, `no-negative-conditionals`, `no-overridden-safeties`, `no-pass-null`, `no-return-null`, `no-skipped-tests`, `no-todo-tests`.

### Rule tiers

- **static** — reliable AST detection; ships in `recommended`.
- **heuristic** — threshold-based detection with configurable options; `warn` by default in `strict` and `error` in `strictest`. Expect to tune options or disable a few in real codebases; every heuristic has a documented option set (see [Options](#options)).

### Machine-readable rule catalog

The published package ships `rules.json` (importable as `@george2f/eslint-plugin-clean-code/rules.json`): every rule with its book ID, tier, config membership, default options, JSON schema, autofix/suggestion flags, and docs link. Useful for tooling and coding agents.

## Chapter 17: Smells and Heuristics

Legend: `static` ships in `recommended` · `heuristic` ships in `strict` as warning · `doc-only` is intentionally not implemented (reason given) — no fake rules.

### Comments

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| C1 | Inappropriate Information | [`clean-code/no-inappropriate-comments`](#options) | heuristic |
| C2 | Obsolete Comment | — | doc-only — requires semantic knowledge of what the code does |
| C3 | Redundant Comment | [`clean-code/no-redundant-comments`](#options) | heuristic |
| C4 | Poorly Written Comment | — | doc-only — subjective; review manually |
| C5 | Commented-Out Code | `clean-code/no-commented-out-code` | static |

### Environment

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| E1 | Build Requires More Than One Step | — | doc-only — keep one `npm run build`; build tooling, not lint |
| E2 | Tests Require More Than One Step | — | doc-only — keep one `npm test`; test tooling, not lint |

### Functions

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| F1 | Too Many Arguments | [`clean-code/max-arguments`](#options) | static |
| F2 | Output Arguments | [`clean-code/no-output-arguments`](#options) | heuristic |
| F3 | Flag Arguments | `clean-code/no-flag-arguments` | static |
| F4 | Dead Function | [`clean-code/no-dead-functions`](#options) | heuristic — same file only |

### General

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| G1 | Multiple Languages in One Source File | [`clean-code/no-multiple-languages`](#options) | heuristic |
| G2 | Obvious Behavior Is Unimplemented | — | doc-only — requires intent; use TDD and review |
| G3 | Incorrect Behavior at the Boundaries | — | doc-only — boundary tests (T5), not lint |
| G4 | Overridden Safeties | [`clean-code/no-overridden-safeties`](#options) | static |
| G5 | Duplication | [`clean-code/no-duplication`](#options) | heuristic — same file; use `jscpd` for cross-file clones |
| G6 | Code at Wrong Level of Abstraction | — | doc-only — design judgement |
| G7 | Base Classes Depending on Their Derivatives | `clean-code/no-base-class-knowing-derivatives` | heuristic |
| G8 | Too Much Information | [`clean-code/limited-public-api`](#options) | heuristic |
| G9 | Dead Code | [`clean-code/no-dead-code`](#options) | static |
| G10 | Vertical Separation | [`clean-code/declaration-proximity`](#options) | heuristic |
| G11 | Inconsistency | — | doc-only — use Prettier and shared configs |
| G12 | Clutter | `clean-code/no-clutter` | heuristic |
| G13 | Artificial Coupling | — | doc-only — design judgement |
| G14 | Feature Envy | [`clean-code/no-feature-envy`](#options) | heuristic |
| G15 | Selector Arguments | [`clean-code/no-selector-arguments`](#options) | heuristic |
| G16 | Obscured Intent | `clean-code/no-obscured-intent` | heuristic |
| G17 | Misplaced Responsibility | — | doc-only — design judgement |
| G18 | Inappropriate Static | `clean-code/no-inappropriate-statics` | heuristic |
| G19 | Use Explanatory Variables | [`clean-code/use-explanatory-variables`](#options) | heuristic |
| G20 | Function Names Should Say What They Do | [`clean-code/function-names-say-what-they-do`](#options) | heuristic |
| G21 | Understand the Algorithm | — | doc-only — requires comprehension; review |
| G22 | Make Logical Dependencies Physical | — | doc-only — design judgement |
| G23 | Prefer Polymorphism to If/Else or Switch/Case | [`clean-code/prefer-polymorphism`](#options) | heuristic |
| G24 | Follow Standard Conventions | — | doc-only — encode conventions as lint rules instead |
| G25 | Replace Magic Numbers with Named Constants | [`clean-code/no-magic-numbers`](#options) | static |
| G26 | Be Precise | `clean-code/be-precise` | heuristic |
| G27 | Structure over Convention | — | doc-only — design judgement |
| G28 | Encapsulate Conditionals | [`clean-code/encapsulate-conditionals`](#options) | heuristic |
| G29 | Avoid Negative Conditionals | `clean-code/no-negative-conditionals` | static |
| G30 | Functions Should Do One Thing | [`clean-code/function-does-one-thing`](#options) | heuristic |
| G31 | Hidden Temporal Couplings | — | doc-only — requires runtime ordering knowledge |
| G32 | Don't Be Arbitrary | — | doc-only — style consistency; use shared configs |
| G33 | Encapsulate Boundary Conditions | `clean-code/encapsulate-boundaries` | heuristic |
| G34 | Functions Should Descend Only One Level of Abstraction | [`clean-code/one-level-of-abstraction`](#options) | heuristic |
| G35 | Keep Configurable Data at High Levels | — | doc-only — placement judgement |
| G36 | Avoid Transitive Navigation (Law of Demeter) | [`clean-code/law-of-demeter`](#options) | heuristic |

### Java section

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| J1 | Avoid Long Import Lists by Using Wildcards | [`clean-code/prefer-namespace-imports`](#options) | heuristic — fights tree-shaking; opt in deliberately |
| J2 | Don't Inherit Constants | `clean-code/no-inherited-constants` | heuristic |
| J3 | Constants versus Enums | — | doc-only — TypeScript idioms differ from Java |

### Names

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| N1 | Choose Descriptive Names | [`clean-code/descriptive-names`](#options) | heuristic |
| N2 | Choose Names at the Appropriate Level of Abstraction | — | doc-only — requires domain knowledge |
| N3 | Use Standard Nomenclature Where Possible | — | doc-only — needs a project lexicon |
| N4 | Unambiguous Names | [`clean-code/no-ambiguous-names`](#options) | heuristic |
| N5 | Use Long Names for Long Scopes | [`clean-code/long-names-for-long-scopes`](#options) | heuristic |
| N6 | Avoid Encodings | [`clean-code/no-encodings`](#options) | static |
| N7 | Names Should Describe Side Effects | [`clean-code/names-describe-side-effects`](#options) | heuristic |

### Tests

| ID | Book rule | Rule | Kind |
|---|---|---|---|
| T1 | Insufficient Tests | — | doc-only — use a coverage tool (`c8`, `nyc`) |
| T2 | Use a Coverage Tool! | — | doc-only — same |
| T3 | Don't Skip Trivial Tests | [`clean-code/no-skipped-tests`](#options) | static |
| T4 | An Ignored Test Is a Question about an Ambiguity | [`clean-code/no-todo-tests`](#options) | static |
| T5 | Test Boundary Conditions | — | doc-only — test design, not lint |
| T6 | Exhaustively Test Near Bugs | — | doc-only |
| T7 | Patterns of Failure Are Revealing | — | doc-only |
| T8 | Test Coverage Patterns Can Be Revealing | — | doc-only |
| T9 | Tests Should Be Fast | — | doc-only |

## Chapter-derived rules

Lintable rules from earlier chapters that are not in the Chapter 17 list:

| Chapter | Principle | Rule | Kind |
|---|---|---|---|
| 3 | Command-Query Separation | `clean-code/command-query-separation` | heuristic |
| 3 | Prefer Exceptions to Returning Error Codes | `clean-code/prefer-exceptions-over-error-codes` | heuristic |
| 7 | Don't Return Null | [`clean-code/no-return-null`](#options) | static |
| 7 | Don't Pass Null | [`clean-code/no-pass-null`](#options) | static |
| 9 | One Assert per Test | [`clean-code/one-assertion-per-test`](#options) | heuristic |

Chapter principles with no lintable rule (documented, by design): Boy Scout Rule, KISS, find the root cause, use dependency injection, separate multi-threading code, prevent over-configurability, prefer dedicated value objects to primitives, hide internal structure, prefer data structures, F.I.R.S.T. (partially covered by `no-skipped-tests` and `one-assertion-per-test`), and all formatting rules (use Prettier).

## Options

Every rule accepts an options object; partial options are merged with the defaults shown below.

| Rule | Defaults |
|---|---|
| `max-arguments` | `{ max: 3 }` |
| `no-dead-code` | `{ ignoreNames: [], ignoreRestSiblings: true }` |
| `no-magic-numbers` | `{ ignore: [0, 1, 2, -1], ignoreDefaultValues: true, ignoreArrayIndexes: false, ignoreEnums: true }` |
| `no-pass-null` | `{ ignoreCallees: ['^use[A-Z]'] }` |
| `no-return-null` | `{ allowNullableReturnType: true }` |
| `no-skipped-tests` | `{ testFunctions: ['it', 'test', 'describe', 'context', 'suite', 'specify'] }` |
| `no-todo-tests` | `{ testFunctions: ['it', 'test', 'specify'] }` |
| `no-inappropriate-comments` | `{ patterns: [] }` (extra regex sources) |
| `no-redundant-comments` | — |
| `no-output-arguments` | — |
| `no-dead-functions` | `{ allow: [] }` |
| `function-does-one-thing` | `{ maxStatements: 20, maxLines: 30 }` |
| `one-level-of-abstraction` | `{ minLowLevelOps: 3, minHighLevelCalls: 2 }` |
| `no-multiple-languages` | `{ checkSql: true, checkHtml: true }` |
| `no-duplication` | `{ minStatements: 4, minNodes: 25 }` |
| `limited-public-api` | `{ maxClassMembers: 25, maxExports: 50 }` |
| `declaration-proximity` | `{ maxDistance: 15 }` |
| `no-feature-envy` | `{ minimumAccesses: 4 }` |
| `no-selector-arguments` | `{ minComparisons: 2 }` |
| `use-explanatory-variables` | `{ minComplexLookups: 1 }` |
| `function-names-say-what-they-do` | `{ forbidden: ['handle', 'process', 'manage', 'util', 'utils', 'misc', 'stuff', 'thing', 'data', 'info', 'temp', 'tmp', 'foo', 'bar', 'baz', 'func', 'fn', 'callback', 'cb', 'do', 'perform', 'execute', 'handleData', 'doStuff', 'doWork', 'doIt'] }` |
| `prefer-polymorphism` | `{ maxSwitchCases: 4, maxIfElseBranches: 5 }` |
| `encapsulate-conditionals` | `{ maxLogicalOperators: 2 }` |
| `law-of-demeter` | `{ maxChainLength: 3, allow: [] }` |
| `descriptive-names` | `{ allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_'], forbidden: ['data', 'info', 'stuff', 'thing', 'temp', 'tmp', 'foo', 'bar', 'baz', 'obj', 'arr', 'val', 'utils', 'misc'] }` |
| `no-ambiguous-names` | `{ confusingNames: ['l', 'O', 'I'] }` |
| `long-names-for-long-scopes` | `{ minLength: 3, allow: ['i', 'j', 'k', 'x', 'y', 'z', 'e', '_', 'it'] }` |
| `no-encodings` | `{ patterns: [], typePrefixes: false }` |
| `names-describe-side-effects` | `{ prefixes: ['get', 'is', 'has', 'find'] }` |
| `prefer-namespace-imports` | `{ maxNamedImports: 10 }` |
| `one-assertion-per-test` | `{ maxAssertions: 1, testFunctions: ['it', 'test'] }` |
| `no-overridden-safeties` | `{ allowEmptyCatch: false, allowTsIgnore: false, requireDisableReason: true }` |

Rules not listed above take no options.

## Autofix and suggestions

Three rules support `eslint --fix`:

| Rule | Automatic fix |
|---|---|
| `no-negative-conditionals` (G29) | Swaps the branches and removes the `!` (consecutive negations like `!!` are removed in one pass) |
| `no-clutter` (G12) | Removes stray `;` statements, turns empty control-flow bodies into `{}`, deletes useless constructors |
| `no-dead-code` (G9, imports only) | Removes the unused import specifier and rewrites the declaration (or emits `import "mod";` when nothing remains, preserving module side effects) |

Editor quick-fixes (suggestions — applied per occurrence, never by `--fix`):

| Rule | Suggestion |
|---|---|
| C5 / C1 / C3 comment rules | Delete the comment |
| `no-dead-code` (G9) | Remove an unused variable declaration (only when its initializer has no side effects), or remove the unreachable statement |
| `no-dead-functions` (F4) | Delete the dead function or private method |
| `no-skipped-tests` (T3) | Un-skip the test |
| `no-clutter` (G12) | Remove the `debugger` statement |
| `no-overridden-safeties` (G4) | Replace `@ts-ignore` with `@ts-expect-error` |

## Overlap with core ESLint rules

Some rules intentionally re-implement book semantics that overlap with core or other popular rules. Enable only one side to avoid duplicate reports:

| This plugin | Overlaps with |
|---|---|
| `max-arguments` (F1) | core `max-params` |
| `no-magic-numbers` (G25) | core `no-magic-numbers` |
| `no-negative-conditionals` (G29) | core `no-negated-condition` |
| `no-dead-code` (G9) | core `no-unused-vars`, `no-unreachable`, `@typescript-eslint/no-unused-vars` |
| `no-obscured-intent` (G16) | core `no-nested-ternary`, `no-sequences`, `no-cond-assign` |
| `no-skipped-tests` (T3) | `jest/no-disabled-tests`, `vitest/no-disabled-tests` |
| `no-overridden-safeties` (G4) | `@typescript-eslint/ban-ts-comment` (for `@ts-ignore`) |

## Heuristics

Heuristic rules are approximations of judgement calls. Every threshold is an option; if a heuristic is noisy in your codebase, first tune its options, then disable it with a comment that explains why — which is exactly the kind of comment the book approves of.

## Development

```sh
npm install
npm test            # vitest + ESLint RuleTester (44 rule suites + integration test)
npm run typecheck   # tsc --noEmit
npm run build       # tsup -> dist (minified ESM + CJS + d.ts + rules.json)
npm run verify:dist # checks the built bundles (rule count, configs, meta)
npm run lint        # builds, then lints the plugin with its own rules + typescript-eslint
```

Each rule lives in `src/rules/<rule-name>.ts` with a colocated `.test.ts`. The book reference is in `meta.docs.cleanCodeId` and `meta.docs.cleanCodeRule`. Contributor notes for coding agents live in [AGENTS.md](AGENTS.md).

## Releasing

Published from CI with npm trusted publishing (OIDC); no tokens are stored anywhere.

1. Bump `version` in `package.json` and add a changelog entry
2. Commit, then tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`
3. `.github/workflows/release.yml` lints, tests, and publishes with provenance

One-time setup: on npmjs.com, configure the package's trusted publisher as GitHub Actions, repository `George2f/eslint-plugin-clean-code`, workflow `release.yml` (the first publish must happen within two days of configuring it).

## License

MIT
