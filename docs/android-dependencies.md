# Android dependency security

Dependabot version proposals and vulnerability alerts are different inputs.
The weekly Gradle entry in `.github/dependabot.yml` checks the checked-in
`/android` build files and wrapper. It does not establish vulnerability coverage.
GitHub needs the **resolved Maven dependency graph**, including transitive
versions, to match Android dependencies against its advisory database.
Vulnerability alerts must also be enabled in repository Settings → Advanced
Security → Dependabot alerts; security-update PRs are a separate optional setting.
No dependency proposal or alert is automatically merged.

## Graph submission

`Android dependency graph` runs on relevant pushes to main, weekly, and by manual
request with **main selected**. Only its guarded main job gets `contents: write`,
which GitHub's Dependency Submission API requires. It has no PR,
`pull_request_target` or `workflow_run` entry point: fork PRs cannot run Gradle with
a write token. Checkout leaves no Git credentials in the working tree. All
external Actions use full SHA pins. No APK or graph artifact is uploaded; the
snapshot goes directly to GitHub's dependency graph. The stable correlator
`tracker-android-main-manual` preserves continuity with the initial main snapshot
(the historical name does not imply subsequent runs are manual). Do not change
this key casually: GitHub retains the latest snapshot per correlator/detector
combination, and an abandoned key can leave stale dependencies visible.

After `npm ci`, the pinned Gradle action uses the existing wrapper and resolves
both debug/release compile and runtime classpaths via `resolveDependencyLocks`.
It also runs the graph plugin's all-project resolution task to capture build/test
configurations in autolinked Expo/React Native modules and included builds. This
includes their external Maven transitives; alerts can concern build tools or tests
as well as application runtime dependencies. The graph plugin also observes dependencies resolved while loading
Gradle plugins, including the React Native and Expo included builds. The job
fails if application resolution or snapshot submission fails. It never rewrites
locks with `--write-locks`, and checks for tracked dependency changes afterwards.
Android SDK components/NDK must be available (standard GitHub Android runner).

A failed submission leaves GitHub's previous snapshot stale. Inspect the Actions
failure, fix the cause in an issue-linked PR, rerun on main and confirm the new
snapshot; a green npm install or an older graph is not fresh Android coverage.
There is no production Firebase access or release publishing in this workflow.

After the first merged run, verify the workflow summary's submission result and
Settings → Dependency graph → Dependencies. For a machine-readable readback:

```sh
gh api repos/hiteshjoshi1/tracker/dependency-graph/sbom \
  --jq '.sbom.packages[] | select(.externalRefs[]?.referenceLocator | contains("pkg:maven/com.facebook.react/react-android@"))'
gh api repos/hiteshjoshi1/tracker/vulnerability-alerts --include
```

The second command returns HTTP 204 when alerts are enabled. An empty alert list
means no matched advisories currently reported, not proof every dependency is
safe. Readbacks can lag a successful snapshot submission.

## Reproducibility and included builds

Keep Gradle 8.10.2 unless a separately reviewed compatibility issue changes it.
`distributionSha256Sum` validates the existing `-all.zip` distribution against
Gradle's published checksum on download. Existing cached downloads are not
retroactively revalidated, so use a fresh Gradle user home when independently
checking the distribution.

`android/buildscript-gradle.lockfile` locks the checked-in root buildscript,
including Android Gradle Plugin/Kotlin/Google Services and their transitives.
`android/app/gradle.lockfile` strictly locks debug/release compile and runtime
classpaths; missing lock state or incompatible resolutions fail those variants.
`settings-gradle.lockfile` records the version catalog's empty external dependency
state. Do not hand-edit generated lockfiles. Refresh them intentionally after an
approved dependency change:

```sh
npm ci
cd android
./gradlew resolveDependencyLocks --write-locks -PreactNativeArchitectures=arm64-v8a
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Review the complete lock diff and run resolution again without `--write-locks`.
Use an explicitly scoped `--update-locks group:module` when a locked module needs
updating. Native changes require Android compilation and relevant phone checks;
iOS-impacting coupled packages require iOS compilation too. The private release
path stays `./gradlew assembleRelease`, then Bluetooth sideloading.

The React Native included build lives in
`node_modules/@react-native/gradle-plugin`; the Expo dev-launcher included build
and autolinked library Gradle sources also live under `node_modules`. Dependabot
cannot safely update those installed/generated files independently. They arrive
via npm's committed `package-lock.json`, so propose their versions through the
coupled Expo/React Native npm group, then regenerate/review Android locks. Do not
add nonexistent checked-in included-build directories to Dependabot or commit
locks inside `node_modules`. Avoid destructive Expo prebuild regeneration; keep
the custom ScreenTime module and registration.

App locks cover their transitive **application** dependencies. Included-build
plugin/tool/test configurations and AGP-created tool configurations are not all
covered by these app locks; their fixed upstream declarations/npm package
versions still matter, and resolved plugin dependencies appear in the submitted
graph. Upstream dynamic declarations are not automatically rewritten: RN selects
its Maven version from installed RN; Expo modules can declare ranges; the
currently unused JSC alternative is `org.webkit:android-jsc:+` (Hermes is enabled).
Switching engines/SDK or introducing variants requires intentional lock refresh,
compatibility review and native compilation. This is not a lock guarantee for
unresolved configurations, other CPU architectures or iOS native dependencies.

References: [Gradle dependency submission](https://github.com/gradle/actions/blob/v6.4.1/docs/dependency-submission.md),
[Gradle 8.10.2 locking](https://docs.gradle.org/8.10.2/userguide/dependency_locking.html),
[GitHub submitted dependencies and alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependency-submission-api),
[Gradle distribution checksums](https://gradle.org/release-checksums/).
