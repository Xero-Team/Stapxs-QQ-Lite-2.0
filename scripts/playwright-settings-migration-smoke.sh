#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
mkdir -p "$repo_dir/output/playwright"
export PLAYWRIGHT_MCP_OUTPUT_DIR="$repo_dir/output/playwright"
base_url="${XERO_QQ_LITE_SMOKE_URL:-http://127.0.0.1:4173}"
cli=(npx --yes --package @playwright/cli@0.1.19 playwright-cli "-s=xero-settings-migration-$$")
trap '"${cli[@]}" close >/dev/null 2>&1 || true' EXIT

"${cli[@]}" open "$base_url"
# Seed the legacy serialized options record before the application bootstrap.
"${cli[@]}" eval "() => { localStorage.removeItem('options'); localStorage.setItem('options', 'enable_external_services:true'); return true; }" | grep -q "true"
"${cli[@]}" goto "$base_url"
sleep 1
# The first boot copies localStorage to the rollback-safe legacy namespace.
"${cli[@]}" eval "() => { const value = localStorage.getItem('options'); localStorage.removeItem('options'); return value === 'enable_external_services:true'; }" | grep -q "true"
"${cli[@]}" goto "$base_url"
sleep 1
"${cli[@]}" eval "() => { const item = [...document.querySelectorAll('li')].find((el) => el.textContent?.includes('设置') || el.textContent?.includes('Options')); item?.click(); return Boolean(item); }" | grep -q "true"
sleep 1
"${cli[@]}" eval "() => document.querySelector('input[name=enable_external_services]')?.checked === true" | grep -q "true"
# Option.load may reserialize the migrated settings for legacy compatibility.
# Verify the canonical key is present rather than treating that rollback-safe
# compatibility write as a migration failure.
"${cli[@]}" eval "() => (localStorage.getItem('options') ?? '').includes('enable_external_services:')" | grep -q "true"
