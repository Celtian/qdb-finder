<div align="center">

# ⚽ QDB Finder

**Fast, offline FIFA player discovery across thirteen game databases.**

[![Build & Publish](https://github.com/Celtian/qdb-finder/actions/workflows/main.yml/badge.svg)](https://github.com/Celtian/qdb-finder/actions/workflows/main.yml)
[![Test PR](https://github.com/Celtian/qdb-finder/actions/workflows/pull-request.yml/badge.svg)](https://github.com/Celtian/qdb-finder/actions/workflows/pull-request.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

[Documentation](https://celtian.github.io/qdb-finder/) · [Releases](https://github.com/Celtian/qdb-finder/releases) · [Changelog](CHANGELOG.md) · [Source](https://github.com/Celtian/qdb-finder)

</div>

QDB Finder is an offline desktop search application for FIFA 11–23 player databases. It combines Angular 22, Angular Material, Tailwind CSS utilities, Electron 43, Node 24's built-in SQLite API, and SQLite FTS5.

## ✨ Features

- 🧭 Browse responsive home, player, team, league, referee, and stadium views with edition-specific details.
- 🔎 Search names and related player text, or find players, teams, leagues, referees, and stadiums by exact Original ID.
- 🎛️ Combine FIFA edition, gender, position, age, overall, potential, team, league, and nationality filters; women player and referee data is available from FIFA 16.
- ⚡ Page and sort results inside SQLite without loading the complete dataset into Angular.
- 📊 Inspect player attributes, team squads and stadiums, league teams and referees, raw fields, and historical editions.
- 🗃️ Rebuild the complete database deterministically from the supplied FIFA text files.
- 🔒 Keep Node.js, SQL, and filesystem access behind a sandboxed, typed Electron preload API.

## 🗂️ Workspace

- `projects/electron/` — Angular renderer, Electron main/preload, typed IPC contracts, and query layer.
- `projects/docs/` — prerendered Angular documentation site for GitHub Pages.
- `tools/database/` — deterministic UTF-16LE TSV-to-SQLite importer and validation.
- `examples/` — source FIFA database text files.
- `resources/database/` — generated, gitignored SQLite database.

The Angular workspace configuration lives at the repository root and uses `newProjectRoot: "projects"`. All application styles are CSS; Material supplies components and its base theme, while Tailwind is limited to utilities and does not enable preflight.

## 🚀 Getting started

Requirements:

- Node.js 24.18
- Yarn Classic 1.22.22

```sh
yarn install --frozen-lockfile
yarn db:build
yarn start
```

Database generation processes 306 available supported-name files, preserves verified tables using `fifatables@0.2.10`, and builds 227,572 player editions, 8,907 team editions, 560 league editions, 2,516 referee editions, 1,371 stadium editions, 3,001 referee-league links, 8,890 stadium-team links, and 241,640 team-player links. The FIFA 23 `dcplayernames` file is header-only and has no definition, so it is recorded as a skipped source without inventing a schema.

## 🧪 Checks and builds

Run the complete source validation:

```sh
yarn validate
```

Or run individual checks and builds:

```sh
yarn format:check
yarn lint
yarn test
yarn build
yarn db:validate
```

## 📦 Distribution

```sh
yarn make
```

Electron Forge creates a Windows x64 Squirrel installer and ZIP. A `v*` tag matching `package.json` and pointing at `master` runs the `🚀 Build & Publish` workflow, rebuilds and validates the full database, publishes a draft GitHub Release, and deploys the prerendered documentation to the `gh-pages` branch. The repository must provide an `ACTIONS_DEPLOY_KEY` secret whose matching public deploy key has write access, and GitHub Pages must publish from the root of `gh-pages`.

Pull requests run the `🧪 Test PR` workflow, including the full database build, source validation, production builds, and Windows x64 package verification.

Initial Windows artifacts are unsigned and may trigger SmartScreen. See [Windows signing](docs/WINDOWS_SIGNING.md).

## 🏷️ Versioning and changelog

Release commands follow the same npm lifecycle used by `quick-commitlint`:

```sh
yarn release:beta
yarn release:patch
yarn release:minor
yarn release:major
```

`npm version` updates `package.json` and `yarn.lock`, runs `auto-changelog -p`, stages `CHANGELOG.md`, creates the release commit and tag, and then pushes the commit and tags. The pushed `v*` tag starts the Build & Publish workflow.

Review the generated [changelog](CHANGELOG.md) before publishing a release. Release commands intentionally push to the configured Git remote through the `postversion` lifecycle script.

## 🔒 Security

The renderer has no Node or filesystem access. Electron uses context isolation and sandboxing; preload exposes only typed player, team, league, referee, stadium, filter, and database-information calls. SQLite is opened read-only in the main process, all values are parameterized, and sort/table choices are constrained in code.

Security vulnerabilities should be reported privately according to the [security policy](SECURITY.md).

## 🤝 Contributing

Contributions are welcome. Read the [contribution guide](CONTRIBUTING.md) before opening a pull request and follow the project [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

Copyright &copy; 2026 [Dominik Hladík](https://github.com/Celtian).

Application code is available under the [MIT License](LICENSE.md). Confirm separately that you have the right to redistribute the supplied FIFA data in release artifacts.
