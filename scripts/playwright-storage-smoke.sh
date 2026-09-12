#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
mkdir -p output/playwright
export PLAYWRIGHT_MCP_OUTPUT_DIR="$repo_dir/output/playwright"
cli=(npx --yes --package @playwright/cli@0.1.19 playwright-cli "-s=xero-storage-smoke-$$")
trap '"${cli[@]}" close >/dev/null 2>&1 || true' EXIT
"${cli[@]}" open "${XERO_STORAGE_SMOKE_URL:-http://127.0.0.1:4174}"
"${cli[@]}" snapshot
"${cli[@]}" --json run-code --filename "$repo_dir/scripts/playwright-storage-smoke.js" |
    node --input-type=module -e '
        let input = "";
        for await (const chunk of process.stdin) input += chunk;
        const response = JSON.parse(input);
        if (response.isError) throw new Error(response.error ?? "Storage smoke failed");
        const result = JSON.parse(response.result);
        const expected = ["concurrent-upsert", "repeat-import", "newest-merge", "compound-key",
            "invalid-restore", "transaction-rollback", "export-clear-restore", "migration-rollback",
            "legacy-migration", "reopen-namespace-clear", "legacy-duplicate-read-export"];
        if (result.passed !== true || result.scenarios?.length !== expected.length ||
            !expected.every((name) => result.scenarios.includes(name)))
            throw new Error("Incomplete storage regression result");
        console.log(JSON.stringify(result));
    '
