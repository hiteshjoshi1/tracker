# Verification

Run commands from the intended checkout; `pwd`, `git branch --show-current` and
`git rev-parse HEAD` identify what is actually being checked. The original Tracker
folder and a sprint review worktree do not share a working directory or branch.

Use Node from `.nvmrc` (22.23.4), its bundled npm 10.9.9, and an installed JDK 21
or newer. CI uses JDK 21. There is no on-demand tool installation in verification.

```sh
nvm install
nvm use
npm ci
npm ci --prefix tools/quality
npm ci --prefix tools/firebase
npm run verify
```

`verify` runs these stages serially, stopping with a nonzero exit code on the
first failure: `lint`, `typecheck`, `test:unit`, `test:policy`, `test:rules`, and
`test:local`. Each is also available through `npm run <stage>` for focused checks.
Unit tests run noninteractively, apart from the real Firebase emulator suites.
All verification stages use UTC for repeatable test date boundaries; this does
not change the running app's device timezone.
The Firebase tests use synthetic `demo-tracker` data, need no production credentials,
start their own servers and stop them on success or failure. Stop manual Firebase
sessions first: ports 8080/9099/4400/4500/9150 must be free, and fixtures are reset.

The verifier selects an existing Java runtime, respecting an explicit `JAVA_HOME`.
On macOS it can use Android Studio's bundled JDK if the system Java launcher fails.
It does not install Java or alter shell configuration. An invalid explicit
`JAVA_HOME` fails with a corrective message.

ESLint is pinned to the tooling supported by the installed Expo 52 CLI, in an
isolated `tools/quality` project. This avoids unrelated changes to the app's
dependency tree. Lint errors fail the gate; warnings are shown in full and remain
warnings under the upstream Expo configuration. They are not silently filtered.
The initial baseline has 38 warnings, mostly existing unused imports/variables and
hook dependencies; a passing lint stage does not claim that baseline is clean.

`verification-results/summary.json` records only the checkout commit, whether the
worktree was dirty, stage names, exit codes and timings. Detailed diagnostics remain in command/CI logs. Do not
upload raw Firebase CLI debug logs: they may include the process environment.

This gate does not replace Android compilation for native changes, iOS compilation
when affected, or the owner's phone approval. Preserve custom ScreenTime code and
the private `cd android && ./gradlew assembleRelease` + Bluetooth installation path.
No store publication, cloud Firebase deployment or release occurs during verify.

## GitHub checks

The stable `Verification` job runs this same command on every PR to `main` and on
main updates, without path filters. It replaces the earlier install-only workflow:
clean installation and lockfile-preservation checks happen before the six stages.
`PR policy` remains a separate check for the issue link and current-commit report.

Workflows pin every external Action by full SHA, default to read-only permissions,
and give PR code no signing, deployment or production Firebase credentials.
Superseded runs are cancelled. The job times out after 20 minutes; command logs
show the failing stage, and a failed run retains only the safe summary JSON for
seven days. Raw Firebase debug logs, environment files and app builds are excluded.

Android/iOS compile gates and making these checks required on main are separate
backlog work. This workflow verifies app logic/access; it does not release an APK
or claim physical-phone, native compilation or dependency-security coverage.
