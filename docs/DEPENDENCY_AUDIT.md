# Dependency audit

The audit was refreshed on 2026-09-13 with:

```sh
yarn npm audit --all --recursive
```

The current lockfile reports 137 advisory entries across 54 packages: 2 critical,
79 high, 50 moderate, and 6 low. The command exits with status 1 until these
advisories are resolved or explicitly accepted. Direct upgrades have removed
the previously reported `jsonpath`, `echarts`, `markdown-it`, `uuid`, and `ws`
findings; remaining exposure is concentrated in transitive build/mobile tooling
(`sharp`, `tar`, `postcss`, `nanoid`, Rollup) and the Vitest/Vue I18n toolchain.
They remain release blockers until the dependency graph is upgraded and rebuilt.

Regenerate this report after dependency changes and update `docs/REFACTOR_BLOCKERS.md` with the remaining release impact.
