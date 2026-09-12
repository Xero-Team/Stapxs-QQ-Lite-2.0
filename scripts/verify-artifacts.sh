#!/usr/bin/env bash
set -euo pipefail

checksum_file="${1:-SHA256SUMS}"
if [[ ! -f "$checksum_file" ]]; then
    echo "Checksum file not found: $checksum_file" >&2
    exit 1
fi

sha256sum --check "$checksum_file"
