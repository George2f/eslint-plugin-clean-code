# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Machine-readable rule catalog (`rules.json`) in the published package
- CI workflow (ESLint 8.57.1 / 9 / 10) and a tag-triggered release workflow using npm trusted publishing
- `AGENTS.md` contributor guide

### Changed

- Package renamed to `@george2f/eslint-plugin-clean-code`; repository moved to `github.com/George2f/eslint-plugin-clean-code`
- Rule `meta.docs.url` now links to the README options section instead of per-rule anchors that did not exist
- Plugin `meta.name` and `meta.version` now come from `package.json` at build time
- Build is minified and ships without source maps to reduce install size

## [0.2.1] - 2026-10-14

### Changed

- `long-names-for-long-scopes` (N5): `it` is now allowed by default for test frameworks
- Internal refactors with no rule behaviour change

## [0.2.0] - 2026-10-14

### Changed

- Version bump of the initial release for local tarball distribution; no functional changes

## [0.1.2] - 2026-10-14

### Added

- Initial release: 44 rules derived from Clean Code (Chapters 3, 7 and 9 plus the automated heuristics from Chapter 17), in `recommended` (12 static rules) and `strict` (all 44) flat configs
