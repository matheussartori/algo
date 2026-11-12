# Security Policy

## Supported versions

Only the latest version, the `main` branch deployed at [algo.mattsartori.com.br](https://algo.mattsartori.com.br), gets security fixes.

## Reporting a vulnerability

Please **do not open a public issue.** Report it privately through [GitHub Security Advisories](https://github.com/matheussartori/algo/security/advisories/new).

Include:

- what you found;
- how to reproduce it;
- what an attacker could do with it.

You should get a reply within a week.

## Scope

The site is static. It has no accounts or server, and it sends no user data anywhere. Learner code runs in a dedicated Web Worker with no DOM access and a 3s timeout.

The worker is **not** a sandbox for untrusted third-party code. It only runs code that people type into their own browser. Code shared between users would need a cross-origin sandboxed iframe or a JS-in-WASM interpreter first.

Reports about the runner, the content pipeline, dependencies or the build are in scope.
