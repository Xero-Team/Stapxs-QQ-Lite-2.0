#!/usr/bin/env bash
set -euo pipefail

base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
cli=(npx --yes --package @playwright/cli playwright-cli -s=xero-qq-lite-smoke)

"${cli[@]}" open "$base_url"
snapshot="$(${cli[@]} snapshot)"
grep -q "Xero QQ Lite" <<<"$snapshot"
grep -q "连接到 OneBot\|Connect to OneBot" <<<"$snapshot"
"${cli[@]}" close
