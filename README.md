<div align="center">

# ⚽ QDB Finder

**Fast, offline exploration of players, teams, leagues, referees, and stadiums across FIFA 11–23.**

[![Build & Publish](https://github.com/Celtian/qdb-finder/actions/workflows/main.yml/badge.svg)](https://github.com/Celtian/qdb-finder/actions/workflows/main.yml)
[![Test PR](https://github.com/Celtian/qdb-finder/actions/workflows/pull-request.yml/badge.svg)](https://github.com/Celtian/qdb-finder/actions/workflows/pull-request.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

[Documentation](https://celtian.github.io/qdb-finder/) · [Releases](https://github.com/Celtian/qdb-finder/releases) · [Changelog](CHANGELOG.md) · [Source](https://github.com/Celtian/qdb-finder)

</div>

QDB Finder is an offline desktop explorer for FIFA 11–23 databases. It combines Angular 22, Angular Material, Tailwind CSS utilities, Electron 43, Node 24's built-in SQLite API, and SQLite FTS5-backed player text search.

## ✨ Features

- 🧭 Browse responsive home, player, team, league, referee, and stadium views with edition-specific details.
- 🔎 Search names and related player text, or find players, teams, leagues, referees, and stadiums by exact Original ID.
- 🎛️ Select one or more installed databases, then combine FIFA edition, gender, position, age, rating, team, league, country, and nationality filters; women player and referee data is available from FIFA 16.
- 🧩 Customize result column visibility and order, retain applied finder filters between visits, and choose a system, light, or dark theme.
- ⚡ Page and sort results inside SQLite without loading the complete dataset into Angular.
- 📊 Inspect player attributes, team squads and stadiums, league teams and referees, raw fields, and historical editions.
- 🗃️ Rebuild the complete database deterministically from the supplied FIFA text files.
- 📁 Import custom FIFA 11–23 text-table folders or PC t3db format-8 databases into isolated databases, search them alongside the built-in data, filter by database, or remove them in the app.
- 🔒 Keep Node.js, SQL, and filesystem access behind a sandboxed, typed Electron preload API.

## 🗂️ Workspace

- `projects/electron/` — Angular renderer, Electron main/preload, typed IPC contracts, and query layer.
- `projects/docs/` — prerendered Angular documentation site for GitHub Pages.
- `tools/database/` — deterministic UTF-16LE TSV-to-SQLite importer and validation.
- `examples/` — source FIFA database text files.
- `resources/database/` — generated, gitignored SQLite database.

The Angular workspace configuration lives at the repository root and uses `newProjectRoot: "projects"`. Components use CSS, the Electron renderer's Material theme is defined in SCSS, and Tailwind is limited to utilities without preflight.

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

### Importing a custom database

Open **Databases** in the desktop navigation and follow the import wizard. Choose either a folder that directly contains files such as `players.txt`, `teams.txt`, and `nations.txt`, or select a PC `fifa_ng_db.db` file together with its matching metadata XML. Direct binary imports use [`fifa-t3db`](https://www.npmjs.com/package/fifa-t3db) and support PC t3db format version 8; Xbox byte order and other binary versions are rejected.

QDB Finder compares the source schema with the FIFA 11–23 definitions and automatically selects a uniquely detected edition. If detection is uncertain, choose the edition manually; compatibility is still checked. **Validate source** scans table structure, values, canonical identifiers, published ranges, and relationships without creating output. Corrupted text rows are reported by line and t3db rows by record; advisory metadata warnings remain importable.

Each successful import is stored as a separate SQLite file in Electron's application-data directory and is included in all-database searches immediately. The bundled database remains immutable, imports can be cancelled safely, and removing a custom database never changes its source files. Databases created with an incompatible future schema remain visible but must be re-imported.

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
yarn db:build
yarn db:validate
```

`yarn test` runs the Electron renderer, documentation, and Node tools suites in parallel. The
full FIFA 11–23 corpus gate remains `yarn db:build && yarn db:validate`; pull-request and release
workflows run both commands before their test and packaging steps.

## 📦 Distribution

```sh
yarn make
```

Electron Forge creates a Windows x64 Squirrel installer and ZIP. A `v*` tag matching `package.json` and pointing at `master` runs the `🚀 Build & Publish` workflow, rebuilds and validates the full database, uploads the Windows artifacts to a draft GitHub Release, and then publishes it. Non-beta tags also deploy the prerendered documentation to the `gh-pages` branch. The repository must provide an `ACTIONS_DEPLOY_KEY` secret whose matching public deploy key has write access, and GitHub Pages must publish from the root of `gh-pages`.

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

The renderer has no Node or filesystem access. Electron uses context isolation and sandboxing; preload exposes typed search, detail, filter-suggestion, and database-management calls instead. Searchable SQLite files are opened read-only in the main process, while validation and import workers create isolated output without granting Angular direct filesystem access. Query values are parameterized, and sort and table choices are constrained in code.

Security vulnerabilities should be reported privately according to the [security policy](SECURITY.md).

## 🤝 Contributing

Contributions are welcome. Read the [contribution guide](CONTRIBUTING.md) before opening a pull request and follow the project [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

Copyright &copy; 2026 [Dominik Hladík](https://github.com/Celtian).

Application code is available under the [MIT License](LICENSE.md). Confirm separately that you have the right to redistribute the supplied FIFA data in release artifacts.
