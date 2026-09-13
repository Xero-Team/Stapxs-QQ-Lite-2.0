#!/usr/bin/env bash
set -euo pipefail

artifact_dir="${1:-dist}"
output_file="${2:-SHA256SUMS}"
if [[ ! -d "$artifact_dir" ]]; then
    echo "Artifact directory not found: $artifact_dir" >&2
    exit 1
fi

mapfile -d '' files < <(find "$artifact_dir" -type f -print0 | sort -z)
if [[ "${#files[@]}" -eq 0 ]]; then
    echo "No artifacts found in: $artifact_dir" >&2
    exit 1
fi

: > "$output_file"
for file in "${files[@]}"; do
    sha256sum "$file" >> "$output_file"
done
echo "Wrote ${#files[@]} artifact checksums to $output_file"
