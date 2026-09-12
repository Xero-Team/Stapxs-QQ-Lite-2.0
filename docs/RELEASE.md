# Release verification

The release workflow publishes `SHA256SUMS` alongside every build artifact. From the extracted release directory, verify the files with:

```sh
bash scripts/verify-artifacts.sh SHA256SUMS
```

The check must report `OK` for every artifact before installation or distribution.
