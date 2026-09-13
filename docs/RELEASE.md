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

The Android workflow requires a runner with the Android SDK and Java 21. If `KEYSTORE_PASSWORD`
and `KEYSTORE_ALIAS_PASSWORD` are set, it runs `yarn build:android` and publishes a signed
package. Otherwise it runs `yarn build:android:unsigned` (`gradlew assembleRelease`) and
uploads the unsigned APK with checksums and `build-metrics.json`. A signed artifact is still
required for a production mobile release.

Windows and macOS desktop packages are produced by the GitHub Actions matrix. This Linux
workstation verified Web production output and an unsigned Android APK; it does not claim
Windows, macOS, or signed iOS evidence.

Each Web build also publishes `build-metrics.json`, containing artifact count, raw and gzip sizes,
the ten largest files, and the build runner's Node/platform identity. The Playwright quality job
publishes `runtime-metrics.json` with browser DOM-content-loaded time and JS heap usage when the
browser exposes it; native startup time, resident memory, and signed artifact evidence still
require the corresponding hosted platform environments.
