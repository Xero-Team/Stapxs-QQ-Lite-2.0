# Web regression checks

Use the Node and Yarn versions declared in `package.json`. Install dependencies with
`yarn install --immutable --mode=skip-build` and initialize the asset submodules
before building. The smoke scripts also require `npx` and Bash.

```bash
yarn typecheck
yarn test:contract
yarn build
npx --yes --package @playwright/cli@0.1.19 playwright-cli install-browser --with-deps chromium
yarn preview --host 127.0.0.1
```

Keep the preview running and execute these in another terminal:

```bash
bash scripts/playwright-smoke.sh
bash scripts/playwright-onebot-smoke.sh
```

Set `XERO_QQ_LITE_SMOKE_URL` when the local preview uses a different URL. Both
scripts use a fresh, temporary browser session, close it on failure or success,
and write ignored diagnostics under `output/playwright/`. Install the browser
through the same pinned CLI package used by the scripts so its binary version
matches the runner.

The first script checks the initial page, CSP, disabled external services, the
data-export entry point, and an offline reload using the service worker.

The OneBot script runs four isolated scenarios: Lagrange and NapCat, each with a
numeric and a string account ID. It completes the welcome flow and login, checks
the backend-specific friend/group/cookie initialization requests, the chat entry
point, string account IDs in connection history, and the disabled external
services setting. All sockets are intercepted; only a synthetic local OneBot
endpoint receives mock responses. Unexpected API requests, third-party HTTP
requests, page exceptions, and incomplete login fail the script. It uses no real
account or access token and blocks service workers in these scenarios to avoid
testing a cached build.

These mocks do not validate a live bot, reconnect/authentication failures,
message sending/receiving, media, revoke/reply, settings migration, or native
platforms. Those checks remain open in `REFACTOR_CHECKLIST.md`. Repository-wide
ESLint and dependency-audit failures are tracked in `REFACTOR_BLOCKERS.md`;
passing these focused regressions does not imply a passing release gate.

## XML card security regression

The XML parser and presentation component are tested in a separate Vue harness,
using Chromium's native XML parser and IndexedDB/localStorage environment. Start
it with `yarn vite --config tests/browser/vite.config.ts`, then run
`bash scripts/playwright-xml-card-smoke.sh`. The script pins the same Playwright
CLI as the OneBot smoke and intercepts every third-party request.

Nine scenarios verify normal text/link/size preservation, explicit image opt-in,
opt-out, HTML/CDATA injection, malformed XML, entity declarations, payload size
limits, unsupported cards, and offline text rendering. Exactly one mock image
request is expected, with no referrer; its local audit contains only the origin.
This is a component regression, not evidence of a live bot or native WebView run.

`yarn typecheck:core` enforces `strict`, `noUncheckedIndexedAccess`, and
`exactOptionalPropertyTypes` for protocol, transport, storage and network modules;
`yarn typecheck:browser` applies the same settings to the harness and its imports.
The Web project's effective config currently only enables `strict`; the remaining
full-project migration is tracked in `REFACTOR_BLOCKERS.md`. Root project
references do not propagate compiler options to the referenced projects.
