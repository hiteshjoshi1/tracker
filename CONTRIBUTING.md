# Contributing to Tracker

The [Tracker backlog](https://github.com/users/hiteshjoshi1/projects/3) is the
single backlog. Do not create another task list or roadmap in the repository.
Repository documentation explains how to work; GitHub issues record what to build.
People and agents should also read [AGENTS.md](AGENTS.md) for checkout, environment
and native-code safeguards.

Tracker is a personal-use app. Delivery is a local Android release APK built with
`./gradlew assembleRelease` in `android/`, then sent to the owner's phone by
Bluetooth for sideloading. Preserve that flow for private previews. App-store
publishing, public build/artifact distribution and production Firebase deployment
require Hitesh's explicit approval; they are never the default delivery path.

Regular dependency installs, locally and in CI, use the committed lockfiles with
`npm ci` (also `npm ci --prefix tools/firebase` when that tools project is present).
See [dependency updates](docs/dependency-updates.md) before changing packages or Actions.

## Before starting

1. File one issue per independently reviewable change using the issue form.
   Include scope, acceptance criteria, verification plan and prerequisite issue links.
2. Add it to the project and set all four fields: Status, Priority, Size and Kind.
   Keep the issue's matching fields and labels consistent with the project.
   Form dropdowns populate the body; they do not set project fields or labels.
3. Hitesh selects and starts sprint scope. Work one issue at a time, or use 2–3
   issues as the default sprint size. His latest approved composition overrides
   that default; a proposal alone does not authorize implementation.
   A large issue must be split into independently reviewable changes before work starts.
4. Fetch `origin` and branch from current `origin/main` in an isolated worktree as
   `issue/<number>-<slug>`. Check the active path, branch and commit before commands
   as described in AGENTS.md. Link the branch in the
   issue's Development section or a comment, and move the issue to In progress.
   Commit and push only on that branch. Changes reach `main` through reviewed PRs.

Priority is P0 Critical (security exposure or data loss), P1 High, P2 Medium or
P3 Low. Size is S (under a day), M (a few days) or L (a week or more). Kind is
Process, Security, CI, Testing, Feature, Bug, Tech debt or Documentation.
Labels use `priority:p0`–`priority:p3`, `size:s`–`size:l`, and `kind:<kind>`
(lowercase; Tech debt is `kind:tech-debt`).

New issues must be manually added to the project, including issues filed through
the API, until the project's built-in Auto-add workflow is enabled for
`repo:hiteshjoshi1/tracker is:issue`. Do not create a second board or treat an
issue outside the project as scheduled work.

## Before review

Open one PR per issue against `main`, with `Closes #<number>` in its description.
Link its URL on the issue. Keep it in draft until its acceptance criteria are met
and its verification report names:

- The full current head commit SHA.
- Commands and manual checks actually run, with results.
- Device, OS and build identifiers for relevant phone/native checks.
- Skipped checks, known risks and limitations (or `None`).

Refresh the report after each push. Do not claim an unrun check passed. The
`PR policy` check validates the branch/issue relationship, issue metadata and
report before review; it does not run application verification or prove the
reported results. Draft PRs still need their issue metadata but may omit the report.
After changing issue metadata, rerun the check or edit the PR description.

The combined verification command [#29](https://github.com/hiteshjoshi1/tracker/issues/29),
application CI [#30](https://github.com/hiteshjoshi1/tracker/issues/30) and required
branch checks are separate backlog changes. Until they land in the checkout being
tested, run the available checks appropriate to the change and report missing
coverage or existing failures. Do not describe `npm run verify` as available before
it exists. A combined review candidate's results must identify its actual SHA
separately from the individual PR heads.

## Board status and completion

| Status | Meaning |
| --- | --- |
| Backlog | Recorded, awaiting scheduling |
| Next up | Agreed and ready to start |
| In progress | Issue branch exists and implementation is underway |
| Fixed-To Review | PR and verification report are ready for Hitesh |
| Waiting on Hitesh | A decision only Hitesh can make blocks progress |
| Done | Hitesh accepted it or explicitly asked us to move it here |

Review feedback returns an issue to In progress. Keep the issue in Fixed-To Review
after merge until Hitesh accepts it; closing an issue and accepting it are distinct.
The merge's closing keyword closes the issue. Merge only within Hitesh's explicit
authorization; passing checks alone do not authorize merging. Production releases require Hitesh's
explicit approval and, once the preview process is implemented, recorded phone tests.
