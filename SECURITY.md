# Security Policy

## Supported Versions

Security fixes are applied to the latest release and the current `master` branch. Users should update to the newest published QDB Finder release.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability. Report security concerns privately by email:

- dominik.hladik@seznam.cz

Include the following details when possible:

- affected QDB Finder version and operating system
- affected component, IPC method, query, or path
- steps to reproduce
- potential impact
- proof-of-concept input with sensitive information removed
- suggested mitigation, if known

## Response Expectations

- Initial acknowledgment within five business days.
- Triage and severity assessment after acknowledgment.
- Coordinated disclosure after a fix is available.

## Security Model

The Electron renderer is sandboxed with context isolation enabled and Node integration disabled. The preload bridge exposes only typed search and database-information methods. SQLite is opened read-only by the main process and query values are parameterized.

Reports describing a way to bypass these boundaries, execute arbitrary SQL, access unintended local files, load untrusted remote content, or replace the packaged database are particularly important.
