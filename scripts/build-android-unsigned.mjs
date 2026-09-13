import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const androidDir = resolve('src/mobile/android')
const gradlew = resolve(androidDir, 'gradlew')
if (!existsSync(gradlew)) {
  console.error('Android Gradle wrapper is missing at', gradlew)
  process.exit(1)
}

const result = spawnSync(gradlew, ['assembleRelease', '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    ANDROID_HOME: process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? '',
  },
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('Unsigned Android release APK built. Signing remains a separate trusted-environment step.')
