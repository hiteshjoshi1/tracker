# Working on Tracker

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the issue, PR and board contract.
The [GitHub board](https://github.com/users/hiteshjoshi1/projects/3) is the single
backlog; keep plans and acceptance criteria in its issues, not a second task list.

## Scope and checkouts

- Hitesh selects and starts sprint scope. His latest approved composition
  overrides older default size limits; proposing a sprint does not authorize it.
- Use one issue, `issue/<number>-<slug>` branch and PR per independent change.
  Fetch `origin` and branch from current `origin/main` in an isolated worktree.
  Link the branch and PR on the issue and keep the board status current.
- Before installing, testing, building or editing, identify the checkout:

  ```sh
  pwd
  git rev-parse --show-toplevel
  git branch --show-current
  git rev-parse HEAD
  git status --short
  git worktree list
  ```

  The original `Tracker` checkout, an issue worktree and a combined sprint review
  candidate are separate checkouts. Switching one does not switch another. Run
  commands in the intended path and record its actual commit. A combined
  candidate contains only the explicitly selected issue commits; name its SHA
  separately from each PR head when reporting integration results.

## Environments and native code

- Follow [local Firebase development](docs/local-firebase.md) for Node/Java,
  environment selection, seeding and synthetic accounts. An Android emulator
  started with `npx expo run:android` is a device; it does not start Firebase
  Auth/Firestore emulators or select the app's backend. Export the documented
  emulator environment before starting Metro or building the debug app.
- `npm run test:rules` and `npm run test:local` start real Firebase emulators,
  own overlapping ports and reset synthetic fixtures. Run them serially, apart
  from manual sessions whose data must survive. Seed again after a local reset.
  Never substitute personal Firebase credentials/data to make local tests pass.
- Preserve the custom Android [ScreenTime module](android/app/src/main/java/com/hiteshjoshi/tracker/ScreenTimeModule.kt),
  its package and registration. Do not use destructive `expo prebuild --clean`
  as a routine rebuild step. Follow the
  [native dependency guidance](docs/dependency-updates.md#reviewing-a-javascriptnative-update).
  Compile Android for native changes and iOS when affected; report missing checks.

## Verification and delivery

- Install with committed lockfiles: `npm ci` and `npm ci --prefix tools/firebase`.
  On the current main, available checks include `npm test -- --runInBand --watch=false`,
  `npx --no-install tsc --noEmit`, `npm run lint`, `npm run test:rules` and
  `npm run test:local`. Availability does not mean a check passes or is fully
  configured. The combined command and application CI are tracked in
  [#29](https://github.com/hiteshjoshi1/tracker/issues/29) and
  [#30](https://github.com/hiteshjoshi1/tracker/issues/30); use them once present
  in the checkout, and do not claim `npm run verify` exists before it does.
- Follow the [PR template](.github/pull_request_template.md): `Closes #<number>`,
  full current head SHA, actual commands/results, relevant device/OS/build,
  skipped checks and limitations. Report baseline failures honestly; do not hide
  them by skipping tests, suppressing errors or making unrelated upgrades.
  Keep the PR draft until its acceptance criteria and report are ready.
- Changes reach `main` through PRs. Passing tests or opening a PR does not itself
  authorize a merge; merge only within Hitesh's explicit approval. Keep merged
  issues Fixed-To Review until Hitesh accepts them or asks to mark them Done.
- The personal delivery path is `cd android && ./gradlew assembleRelease`, then
  Bluetooth transfer of `android/app/build/outputs/apk/release/app-release.apk`
  for private phone installation. Hitesh must authorize a production release,
  production Firebase deployment, app-store publishing or public distribution.
  Preserve this APK flow; a staging project or store upload is not a prerequisite.
  See [Firebase deployment and recovery](docs/firebase.md#deployment-and-recovery-requires-a-separate-explicit-instruction)
  before any separately authorized backend deployment.
