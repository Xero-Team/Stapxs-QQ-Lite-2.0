#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
mkdir -p output/playwright
export PLAYWRIGHT_MCP_OUTPUT_DIR="$repo_dir/output/playwright"
base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
cli=(npx --yes --package @playwright/cli@0.1.19 playwright-cli "-s=xero-auth-failure-smoke-$$")
trap '"${cli[@]}" close >/dev/null 2>&1 || true' EXIT

"${cli[@]}" open "$base_url"
"${cli[@]}" --json run-code --filename "$repo_dir/scripts/playwright-auth-failure-smoke.js" |
    node --input-type=module -e '
        let input = "";
        for await (const chunk of process.stdin) input += chunk;
        const response = JSON.parse(input);
        if (response.isError) throw new Error(response.error ?? "Authentication failure smoke failed");
        const result = JSON.parse(response.result);
        if (result.passed !== true) throw new Error("Incomplete authentication failure smoke result");
        console.log(JSON.stringify(result));
    '
