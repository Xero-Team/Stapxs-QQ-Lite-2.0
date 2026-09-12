# Dependency audit

The audit was run on 2026-09-12 with:

```sh
yarn npm audit --all --recursive
```

The current lockfile reports 192 advisories: 3 critical, 98 high, 79 moderate, and 12 low. The command exits with status 1 until these advisories are resolved or explicitly accepted. Most findings are in build and mobile tooling; they still remain release blockers until the dependency graph is upgraded and rebuilt.

Critical findings currently include:

- **handlebars 4.7.8**: JavaScript injection via AST type confusion ([GHSA-2w6w-674q-4c4q](https://github.com/advisories/GHSA-2w6w-674q-4c4q)).
- **tar 6.2.1 / 7.5.2 / 7.5.13**: decompression and parsing denial of service ([GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)).
- **vitest 2.1.9**: arbitrary file read and execution when the Vitest UI server is enabled ([GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)).

Regenerate this report after dependency changes and update `docs/REFACTOR_BLOCKERS.md` with the remaining release impact.
