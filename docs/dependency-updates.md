# Dependency updates

Use `nvm install` and `nvm use` to select `.nvmrc`, then `npm ci`. The committed
`package-lock.json` is the dependency tree; `npm ci` fails on manifest/lockfile
drift and never updates the lockfile. Install the isolated emulator/rules tools
with `npm ci --prefix tools/firebase` once that project is present. Keep both
lockfiles in the PR when an intentional dependency change affects them.

The Dependency install workflow runs these installs on PRs and main, checks that
they leave manifests/locks unchanged, and needs no application or Firebase secrets.
It checks reproducibility; application tests and security scanning have separate
backlog issues. Deprecation warnings or a successful install do not establish
that packages are secure or compatible.

## Dependabot proposals

`.github/dependabot.yml` checks the root npm project, isolated Firebase tools,
GitHub Actions and Android Gradle weekly on Monday at 09:00 Singapore time. It
caps open version update proposals at three for npm and two each for Actions and
Android Gradle. The resolved Android graph,
lock refresh procedure, generated included-build exceptions and alert readback
are described in [Android dependency security](android-dependencies.md).

There is no auto-merge workflow. Each proposal needs an issue on the Tracker
board, review and a verification report. Dependabot's generated branches do not
meet our issue-branch naming/report policy. To adopt a proposal, create
`issue/<number>-<slug>` from current main, apply its dependency changes, open the
issue-linked PR, and link/close the original bot proposal as superseded. Never
relax the PR policy to merge an unreviewed bot branch.

Dependabot groups Expo, React, React Native and coupled Expo/native packages for
both version and security proposals. A group only assembles the available
updates; it does not select a compatible SDK combination. Check all coupled
packages even when a proposal changes just one of them. A security update that
cannot fit the current SDK is an explicitly reviewed compatibility issue.

## Reviewing a JavaScript/native update

1. Read release notes and provenance for the requested versions. Review Expo SDK,
   React, React Native, Expo Router and native package versions together. Upgrade
   Expo SDKs incrementally, with an issue stating the target combination.
2. Use the installed Expo CLI's `npx --no-install expo install --check` to check
   the proposed tree. Use the official SDK release notes and Expo Doctor as
   additional evidence; if a Doctor version is needed, select/pin it explicitly
   instead of silently downloading the latest tool. Record existing diagnostics.
3. Apply the chosen compatible versions intentionally and regenerate the affected
   lockfile with `npm install` in the update branch. Review the lockfile diff and
   transitive additions; do not run `npm audit fix --force` as a substitute.
4. From a clean checkout, run `npm ci`, applicable lint/type/unit/Firebase checks,
   and Android compilation for native-impact changes. Compile iOS when affected.
   Package/lock/config changes can affect both native platforms. Keep the custom
   Android ScreenTime module and its registration intact; destructive Expo
   prebuild regeneration is not a routine update step.
5. Install the local release APK privately on the owner's phone and record the
   commit, build/version, relevant auth/reminder/usage checks and limitations.
   The delivery path remains `cd android && ./gradlew assembleRelease`, then
   Bluetooth sideloading. No store upload or public artifact is needed.

An existing compatibility diagnostic must be reported, not fixed by an unrelated
dependency upgrade inside the automation setup. A missing build or phone check
stays visible in the PR; it is not a passing result.

## Reviewing an Actions update

Every external `uses:` reference is a full 40-character commit SHA with a readable
version comment. Verify the proposed SHA against the upstream repository/release,
review its changes and permission/runtime requirements, and retain the pin when
adopting a Dependabot proposal. Mutable tags such as `@v4` are not accepted pins.
Workflows use read-only permissions unless a specific reviewed job needs more;
PR dependency installs receive no signing, Firebase or release credentials.

References: [Dependabot configuration](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference),
[npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci),
[Expo SDK upgrades](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).
