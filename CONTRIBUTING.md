# Contributing

Thanks for your interest in improving QDB Finder.

## Prerequisites

- Node.js 24.18.x
- Bun 1.3.14
- Enough free disk space for the generated SQLite database and Electron package

Windows is the primary packaging target. Development and database generation also work on Linux and macOS with a compatible Node.js version.

## Getting Started

1. Fork and clone the repository.
2. Install dependencies from the lockfile:

```bash
bun install --frozen-lockfile
```

3. Generate and validate the local database:

```bash
bun run db:build
bun run db:validate
```

4. Start the Angular renderer and Electron shell:

```bash
bun run start
```

Generated databases, application bundles, and Forge output are gitignored and must not be committed.

## Workspace Structure

- `projects/electron/` contains the Angular renderer, Electron main process, preload bridge, contracts, and SQLite query layer.
- `projects/docs/` contains the prerendered documentation application.
- `tools/database/` contains the deterministic FIFA text importer and its integration tests.
- `examples/` contains the source FIFA database text files.

The workspace uses standalone, strict, zoneless Angular applications and CSS stylesheets. Generate new Angular artifacts with Angular CLI and keep applications under `projects/`.

## Project Commands

- `bun run start` — start the renderer and desktop shell.
- `bun run db:build` — rebuild SQLite from the checked-in example data.
- `bun run db:validate` — run SQLite integrity and acceptance checks.
- `bun run build` — build the renderer, prerendered docs, Electron main process, and preload.
- `bun run test` — run Angular, importer, and query tests.
- `bun run lint` — lint Angular templates and all TypeScript environments.
- `bun run format:check` — verify Prettier formatting.
- `bun run make` — generate Windows x64 Squirrel and ZIP artifacts.

## Contribution Process

1. Create a focused branch from `master`.
2. Make scoped changes using Conventional Commit messages such as `feat(app): add a filter` or `fix(db): correct a mapping`.
3. Run the relevant database build when importer schemas or canonical mappings change.
4. Before opening a pull request, run:

```bash
bun run format:check
bun run lint
bun run test
bun run build
bun run db:validate
```

5. Open a pull request explaining what changed, why it changed, how it was tested, and whether it affects database or release artifacts.

## Coding and Data Standards

- Follow the repository's Angular and TypeScript instructions in `AGENTS.md`.
- Use Signal Forms and signals for new renderer form/state work.
- Keep Electron's renderer sandboxed and expose only narrow typed APIs through preload.
- Never expose raw SQL or filesystem access over IPC.
- Parameterize all values passed to SQLite and constrain identifiers in code.
- Do not infer schemas for unsupported FIFA tables. Schema changes must be backed by `fifatables` definitions or documented evidence.
- Do not manually edit generated SQLite files.
- Maintain keyboard operation, visible focus, appropriate ARIA labels, and WCAG AA contrast.

## Reporting Issues

Bug reports should include:

- expected and actual behavior
- reproduction steps and search/filter values
- QDB Finder version and FIFA edition involved
- operating system and architecture
- database metadata from the application, when available
- screenshots or relevant error output with private information removed

Report security concerns privately as described in `SECURITY.md`.

## Git Hooks

`bun install` configures Husky automatically. The pre-commit hook formats and lints staged source files through lint-staged. The commit-message hook enforces Conventional Commits with the configured project scopes: `app`, `db`, `deps`, `docs`, `electron`, `release`, `tooling`, and `update`.
