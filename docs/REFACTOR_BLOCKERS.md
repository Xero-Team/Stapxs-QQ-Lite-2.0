# Refactor blockers

## 2026-09-12

- The checkout provides Node (`/usr/bin/node`) and `npx`, but no `yarn` or Corepack executable. Dependency installation and the required `yarn check`/`yarn build` gates cannot run until Corepack/Yarn is installed. No passing result is claimed.
- Full dependency upgrades and cross-platform builds remain pending the package-manager bootstrap; existing lockfiles are preserved to avoid data or dependency loss.
- Yarn 4.12.0 is now available through the local Corepack shim and dependencies install, but the web build is blocked because the checked-out tree lacks `src/renderer/src/assets/img/qq-face/public/assets/qq_emoji/_index.json` (the expected asset/submodule content). Typecheck and lint can run independently.
- The registry's latest Vue/Vite/TypeScript/ESLint/Pinia/Electron combination is currently incompatible with this dependency graph: Vite 8 conflicts with `@vitejs/plugin-vue` 5, ESLint 10 conflicts with the installed Vue/TypeScript configs, and the TypeScript 7 patch failed during fetch. The attempted upgrade was discarded; upgrades must proceed package by package with matching plugins.
- Native `sharp@0.32.6` postinstall fails in this environment, so Yarn exits non-zero after linking even though JavaScript dependencies are available.
- `yarn npm audit --all --recursive` currently exits 1 with 192 advisories (including 3 critical findings in Handlebars, tar, and Vitest); dependency upgrades and an application impact review are required before enabling the audit as a passing release gate.

## Resolved in the current checkout

- Yarn 4.12.0 is available through the installed Corepack shim; `yarn install --immutable --mode=skip-build` completes with peer-dependency warnings.
- The QFace and Border Card UI submodules have been initialized. `yarn build` now succeeds; the previous missing `qq_emoji/_index.json` error no longer reproduces.
- Playwright CLI smoke passed against the production preview, covering the first screen, OneBot entry point, and the default disabled external-services setting.
- Full repository ESLint still reports legacy errors and warnings. Targeted protocol, transport, storage, network-policy, and smoke files pass their checks.
