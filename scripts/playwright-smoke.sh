#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
mkdir -p "$repo_dir/output/playwright"
export PLAYWRIGHT_MCP_OUTPUT_DIR="$repo_dir/output/playwright"
cli=(npx --yes --package @playwright/cli@0.1.19 playwright-cli "-s=xero-qq-lite-smoke-$$")
trap '"${cli[@]}" close >/dev/null 2>&1 || true' EXIT

"${cli[@]}" open "$base_url"
snapshot="$(${cli[@]} snapshot)"
grep -q "Xero QQ Lite" <<<"$snapshot"
grep -q "连接到 OneBot\|Connect to OneBot" <<<"$snapshot"
"${cli[@]}" eval "() => { const external = performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => /^https?:/.test(name) && !name.startsWith(location.origin)); return JSON.stringify(external); }" | grep -q '\[\]'
"${cli[@]}" eval "() => document.querySelector('meta[http-equiv=Content-Security-Policy]')?.content.includes(\"script-src 'self'\") === true" | grep -q "true"
"${cli[@]}" eval "() => { const item = [...document.querySelectorAll('li')].find((el) => el.textContent?.includes('设置') || el.textContent?.includes('Options')); item?.click(); return Boolean(item); }" | grep -q "true"
"${cli[@]}" eval "() => document.querySelector('input[name=enable_external_services]')?.checked === false" | grep -q "true"
"${cli[@]}" eval "() => [...document.querySelectorAll('button')].some((button) => /导出|Export/.test(button.textContent ?? ''))" | grep -q "true"
# Capture browser-side runtime evidence before switching offline. Chromium may
# not expose memory metrics, so the field is explicitly nullable.
runtime_eval="() => { const navigation = performance.getEntriesByType('navigation')[0]; const memory = performance.memory?.usedJSHeapSize ?? null; const payload = { schemaVersion: 1, measuredAt: new Date().toISOString(), startupMs: navigation?.domContentLoadedEventEnd ?? null, jsHeapBytes: memory, url: location.origin }; return 'XERO_METRICS:' + btoa(JSON.stringify(payload)); }"
set +e
runtime_output="$("${cli[@]}" --raw eval "$runtime_eval")"
set -e
runtime_encoded="$(printf '%s\\n' \"$runtime_output\" | sed -n 's/.*XERO_METRICS:\\([A-Za-z0-9+\\/=]*\\).*/\\1/p' | tail -n 1)"
runtime_encoded="${runtime_encoded//\\\\/}"
runtime_encoded="${runtime_encoded//\\\"/}"
if [[ -z "$runtime_encoded" && "$runtime_output" == *XERO_METRICS:* ]]; then
    runtime_encoded="${runtime_output#*XERO_METRICS:}"
    runtime_encoded="${runtime_encoded%%\"*}"
fi
if [[ -n "$runtime_encoded" ]]; then
    printf '%s' "$runtime_encoded" | base64 --decode > "$repo_dir/output/playwright/runtime-metrics.json"
fi
"${cli[@]}" network-state-set offline
"${cli[@]}" goto "$base_url"
offline_snapshot="$(${cli[@]} snapshot)"
grep -q "连接到 OneBot\|Connect to OneBot" <<<"$offline_snapshot"
"${cli[@]}" eval "() => performance.getEntriesByType('resource').every((entry) => !/^https?:/.test(entry.name) || entry.name.startsWith(location.origin))" | grep -q "true"
