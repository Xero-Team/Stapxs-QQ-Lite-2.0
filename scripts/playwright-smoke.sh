#!/usr/bin/env bash
set -euo pipefail

base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
cli=(npx --yes --package @playwright/cli playwright-cli -s=xero-qq-lite-smoke)

"${cli[@]}" open "$base_url"
snapshot="$(${cli[@]} snapshot)"
grep -q "Xero QQ Lite" <<<"$snapshot"
grep -q "连接到 OneBot\|Connect to OneBot" <<<"$snapshot"
"${cli[@]}" eval "() => { const external = performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => /^https?:/.test(name) && !name.startsWith(location.origin)); return JSON.stringify(external); }" | grep -q '\[\]'
"${cli[@]}" eval "() => document.querySelector('meta[http-equiv=Content-Security-Policy]')?.content.includes(\"script-src 'self'\") === true" | grep -q "true"
"${cli[@]}" eval "() => { const item = [...document.querySelectorAll('li')].find((el) => el.textContent?.includes('设置') || el.textContent?.includes('Options')); item?.click(); return Boolean(item); }" | grep -q "true"
"${cli[@]}" eval "() => document.querySelector('input[name=enable_external_services]')?.checked === false" | grep -q "true"
"${cli[@]}" close
