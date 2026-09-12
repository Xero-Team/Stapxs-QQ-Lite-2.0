# Refactor blockers

## 2026-09-12

- The checkout provides Node (`/usr/bin/node`) and `npx`, but no `yarn` or Corepack executable. Dependency installation and the required `yarn check`/`yarn build` gates cannot run until Corepack/Yarn is installed. No passing result is claimed.
- Full dependency upgrades and cross-platform builds remain pending the package-manager bootstrap; existing lockfiles are preserved to avoid data or dependency loss.
- Yarn 4.12.0 is now available through the local Corepack shim and dependencies install, but the web build is blocked because the checked-out tree lacks `src/renderer/src/assets/img/qq-face/public/assets/qq_emoji/_index.json` (the expected asset/submodule content). Typecheck and lint can run independently.
