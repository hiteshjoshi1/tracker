# Tracker

Tracker is a personal React Native/Expo Android app with Firebase authentication
and storage. The owner installs a locally built release APK by Bluetooth; no
app-store publication is needed. Android includes a custom ScreenTime module.
iOS/web configuration exists, but Android is the current validated development
path; Android checks do not establish iOS or physical-phone coverage.

Use the [GitHub board](https://github.com/users/hiteshjoshi1/projects/3) as the
single backlog. Read [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md)
before changing code or opening a PR.

## Select the checkout first

Run every command below from the repository root of the **chosen checkout**,
except the release build explicitly run inside `android/`. In each terminal,
first `cd` to that same root and check:

```sh
pwd
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
git worktree list
npm run
```

The original Tracker folder, an issue worktree and a combined sprint review
candidate can contain different code and scripts. Use the exact review path and
branch supplied with the sprint; changing branches in another terminal or
worktree does not change this checkout. Record the SHA you actually tested.

`Missing script: "test:rules"` (or `verify`) can mean an older/wrong checkout.
Inspect the path, branch, commit and `npm run` output first. Installing packages
does not add scripts missing from that checkout's `package.json`; do not edit
scripts just to make an older branch resemble the review candidate.

## Install the pinned tools

Install nvm, Android Studio with an Android SDK/virtual device, and JDK 21 or
newer. From the chosen repository root:

```sh
nvm install
nvm use
node --version
npm --version
npm ci
npm ci --prefix tools/quality
npm ci --prefix tools/firebase
```

`.nvmrc` pins Node 22.23.4 with npm 10.9.9. All three projects have committed
lockfiles; use `npm ci` for ordinary installs. See
[dependency updates](docs/dependency-updates.md) before changing packages.

Set `JAVA_HOME` to your installed JDK 21+ for manual Firebase/Gradle commands.
On macOS, Android Studio's bundled JDK can be selected in each development terminal:

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

Use your actual JDK path on other installations. The verifier can also discover
an installed Android Studio JDK on macOS; it does not install Java.

## Verify without a running app

Stop manual Firebase emulator sessions first, then from the chosen root run:

```sh
npm run verify
```

This runs lint, TypeScript, Jest, PR-policy tests, Firestore rules tests and local
Auth/Firestore smoke tests serially. It starts/stops its own real Firebase
emulators with synthetic `demo-tracker` data. Ports 8080/9099/4400/4500/9150 must
be free; fixtures are reset. The first run may download emulator binaries.

See [verification](docs/verification.md) for individual commands, diagnostics and
CI. GitHub's stable **Verification** check runs the same gate; **PR policy**
separately checks the issue link and current-commit verification report. Inspect
both results for the proposed commit. These checks are not yet required branch
protection and do not authorize a merge or release.

Existing lint warnings remain visible; a passing gate is not a clean lint audit.
Expected `PERMISSION_DENIED` messages occur when access tests prove anonymous or
cross-user operations are rejected; judge the final test/stage exit status.
Native compilation, phone tests, notification/usage-access permissions, production
index readiness and dependency-security coverage remain separate checks.

## Run against local Firebase on an Android emulator

The Android virtual device and Firebase backend emulators are separate processes.
`npx expo run:android` builds/launches the app; it does not start Firebase servers
or choose a safe backend. Use synthetic local mode explicitly; personal Firebase
credentials and Google OAuth are unnecessary here.

In terminal A, at the chosen root with Java configured:

```sh
npm run emulators
```

Wait until Auth and Firestore report ready. In terminal B, at the **same root**,
seed the local project and export the app's Android-emulator endpoints:

```sh
npm run emulators:seed
set -a
source .env.emulator.example
set +a
export EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=10.0.2.2:9099
export EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=10.0.2.2:8080
npx expo run:android
```

Start the Android virtual device in Android Studio if needed. The sourced sample
selects project `demo-tracker`; `10.0.2.2` routes the Android client to the host's
loopback servers. Export the variables **before** building or starting Metro.
`run:android` starts Metro too; do not start a competing Metro instance first.
If only restarting Metro, stop it with Ctrl-C and, in that same configured terminal,
run `npx expo start --dev-client --localhost --clear`. Rebuild with `run:android`
when native code changes. Do not use destructive `expo prebuild --clean`: it can
overwrite the committed ScreenTime native customization.

The login button should say **LOCAL TEST: sign in as Alice**. Seeded accounts are
`alice@tracker.test` and `bob@tracker.test`, password `Tracker-local-only-123!`.
Fixtures have the fixed date **15 January 2026**; choose that date in the journal
or create a fresh goal to inspect today's data. Local notifications/push are
disabled. This is not a separately named/package-identified test app: prefer the
Android virtual device to avoid replacing the owner's installed app.

For manual review, record the commit, device/Android version and build identifier.
Capture the LOCAL TEST login and relevant changed screens; check login/logout,
owner create/edit/delete/list updates and any affected offline/reconnect flow.
Report what you actually checked and every skipped item. Screenshots do not
replace permission, access-rule, native-build or physical-phone evidence.

Stop Metro and the Firebase servers with Ctrl-C in their respective terminals.
On restart, run `npm run emulators` and `npm run emulators:seed` again; re-export
the sample and Android endpoints in a new app terminal. For a deliberate clean
fixture reset while servers run, use `npm run emulators:reset` then
`npm run emulators:seed` and log in again. Reset and unattended tests erase local
fixtures: do not run them alongside a manual session you want to preserve.
See [local Firebase development](docs/local-firebase.md) for USB-phone routing,
session isolation and troubleshooting. No unavailable local backend falls back
to production.

## Build the ordinary private release

Use a **fresh terminal with the owner's normal production configuration**,
separate from the terminal that sourced `.env.emulator.example`. Verify the
checkout/commit first. The ignored owner-configured `.env` (see
[.env.example](.env.example)) and real Android Google service configuration must
be present; emulator endpoints must not be exported. Never copy synthetic debug
Google service configuration into a release. A development build selecting
production is deliberately rejected.

After Hitesh authorizes the release, from the repository root:

```sh
cd android
./gradlew assembleRelease
```

The APK is `android/app/build/outputs/apk/release/app-release.apk` relative to the
repository root. Pair the Mac and phone, transfer it with Bluetooth File Exchange
and sideload privately. Record the commit/build and phone results for release
approval. Do not publish to an app store, distribute publicly or deploy production
Firebase without Hitesh's explicit instruction. A remote staging project is not
required for this private APK flow; see [Firebase policy](docs/firebase.md) for
separately authorized backend deployment and recovery.
