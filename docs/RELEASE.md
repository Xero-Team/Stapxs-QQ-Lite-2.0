# Release verification

The release workflow publishes `SHA256SUMS` alongside every build artifact. From the extracted release directory, verify the files with:

```sh
bash scripts/verify-artifacts.sh SHA256SUMS
```

The check must report `OK` for every artifact before installation or distribution.

The `next` release workflow builds the web bundle, Electron on Linux/Windows/macOS, Tauri on
Linux/Windows/macOS, and an Android package. Each platform job uploads into the same release
verification set; a release is not published until every required job completes. macOS builds use
unsigned artifacts in CI (`CSC_IDENTITY_AUTO_DISCOVERY=false`); signing must be performed in a
separate trusted release environment with an explicit certificate and keychain configuration.

The Android workflow requires a runner with the Android SDK and Java 21. If that runner cannot
produce an APK/AAB, the job fails instead of publishing a partial mobile release. Platform builds
have not been executed locally on this Linux workstation; the GitHub Actions matrix is the
authoritative cross-platform verification path.

Each Web build also publishes `build-metrics.json`, containing artifact count, raw and gzip sizes,
the ten largest files, and the build runner's Node/platform identity. Its runtime fields remain
`null` until a browser or native platform job measures startup time and resident memory; a release
must not treat missing runtime measurements as passing performance evidence.
