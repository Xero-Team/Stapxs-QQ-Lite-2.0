#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
export PLAYWRIGHT_MCP_OUTPUT_DIR="$repo_dir/output/playwright"
cli=(npx --yes --package @playwright/cli@0.1.19 playwright-cli "-s=xero-onebot-smoke-$$")
trap '"${cli[@]}" close >/dev/null 2>&1 || true' EXIT

"${cli[@]}" open "$base_url"
"${cli[@]}" --json run-code --filename "$repo_dir/scripts/playwright-onebot-smoke.js" |
    node --input-type=module -e '
        let input = "";
        for await (const chunk of process.stdin) input += chunk;
        const response = JSON.parse(input);
        if (response.isError) throw new Error(response.error ?? "OneBot smoke failed");
        const result = JSON.parse(response.result);
        if (result.passed !== true || result.scenarios?.length !== 4)
            throw new Error("Incomplete OneBot smoke result");
        console.log(JSON.stringify(result));
    '
