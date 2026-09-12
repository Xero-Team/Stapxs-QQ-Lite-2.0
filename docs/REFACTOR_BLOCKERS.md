# Refactor blockers

## 2026-09-12

- The checkout provides Node (`/usr/bin/node`) and `npx`, but no `yarn` or Corepack executable. Dependency installation and the required `yarn check`/`yarn build` gates cannot run until Corepack/Yarn is installed. No passing result is claimed.
- Full dependency upgrades and cross-platform builds remain pending the package-manager bootstrap; existing lockfiles are preserved to avoid data or dependency loss.
