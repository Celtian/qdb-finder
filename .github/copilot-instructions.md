# QDB Finder development instructions

QDB Finder is an Angular 22 and Electron workspace. Applications live under `projects/`, database tooling lives under `tools/`, and generated artifacts are gitignored.

## Angular

- Use Angular CLI to generate Angular artifacts.
- Use standalone, strict, zoneless Angular APIs.
- Use signals and Signal Forms for new state and forms.
- Use native template control flow and accessible Angular Material components.
- Use CSS stylesheets only. Material owns component styling and theming; Tailwind is limited to utilities and must not enable preflight.

## Electron and SQLite

- Keep `contextIsolation` and `sandbox` enabled and `nodeIntegration` disabled.
- Electron main owns the only SQLite connection.
- Expose only narrow typed operations through preload; never expose raw SQL or filesystem APIs.
- Parameterize query values and constrain SQL identifiers with explicit allowlists.
- Preserve read-only behavior for the packaged database.

## FIFA data

- Validate source headers against `fifatables` definitions.
- Use `fifadate` for FIFA date values and `fifarating` for supported position ratings.
- Do not infer schemas for unsupported tables.
- Keep database generation deterministic and verify canonical counts and SQLite integrity.

## Verification

Run formatting, linting, tests, builds, and database validation appropriate to the change. Do not commit generated databases, `dist/`, `.electron/`, or `out/`.
