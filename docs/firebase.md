# Firebase configuration and ownership

Tracker's personal-use Android release is a locally built APK, transferred to the
phone and sideloaded. Firebase configuration is independent of app-store delivery.
These files and tests do not deploy anything or change the existing installed app.

## Rules and query inventory

`firestore.rules` allows authenticated users to access only records whose `userId`
matches their Auth UID. Creates require that UID, and updates cannot replace,
remove or change it. Unknown collections and all subcollections deny access.
Quotes are personal records, not a shared public collection. Rules deliberately
preserve the existing record shapes rather than introducing an unrelated migration.

| Collection | Current client queries | Composite indexes |
| --- | --- | --- |
| goals | Owner; owner/date ranges and listeners; rollover before date; incomplete before date | userId/date; userId/completed/date |
| goodDeeds | Owner; owner/date ranges and listeners | userId/date |
| reflections | Owner; owner/date ranges and listeners | userId/date |
| habits | Owner; owner/name ascending; inherited date/listener methods | userId/name; userId/date |
| quotes | Owner/favorite descending/createdAt descending; favorite-only variant; inherited date/listener methods | userId/favorite/createdAt (both equality and sort variants); userId/date |

Sources: `services/firebaseService.ts`, `habitService.ts`, `quoteService.ts`,
`analyticsService.ts` and `models/types.ts`. Direct document reads/updates/deletes
also require ownership. A client `where('userId', '==', uid)` is required for
collection queries; rules are not a filter and reject unbounded/cross-owner queries.

`firestore.indexes.json` versions the current composite query shapes. The emulator
checks rules and query authorization but does **not** enforce composite-index
requirements. Index creation/readiness and real query smoke tests must be checked
on a deliberately selected remote test project before any production deployment.
Deployed Firebase rules/indexes have not been inspected or replaced by this work.

## Run access tests locally

Use Node 22 and Java 21 or newer for this pinned Firebase CLI/emulator toolchain.
The Firebase tool project has its own lockfile so CLI dependencies do not enter
the Expo application dependency graph.

The tools SDK stays at the app's locked Firebase version for rule-test fidelity.
Its development-only gRPC transport is overridden to patched `1.14.7` (the SDK's
old transitive range includes GHSA-m9gg-hp2v-232j). This does not change the app's
installed transport or dependency versions. Review toolchain advisories separately;
an emulator test passing does not certify the application's dependency security.

```sh
npm ci --prefix tools/firebase
npm run test:rules
```

The first run downloads the emulator. It starts a loopback-only Firestore emulator,
loads the committed rules, tests under the non-existent `demo-tracker` project,
and stops it on exit. There is no login, service-account key, cloud project or
production data requirement. Tests fail if no loopback emulator endpoint is set.
Do not point these tests at an already running local emulator containing data you
want to retain: they reset the emulator's `demo-tracker` records.

Tests cover owner CRUD, date queries/listeners, habit/quote ordering, anonymous and
cross-user access, forged creates/overwrites, ownership changes/removal and atomic
batch rejection across all five collections. Unknown/nested paths are denied.

## Deployment and recovery (requires a separate explicit instruction)

There is intentionally no default `.firebaserc` project, automatic deployment or
production credential in the repository. Always pass a verified explicit project
ID. A remote staging project (#33) is deferred: local emulator tests are the
current first step and work with private APK delivery.

If a separate remote test project is chosen later:

1. Record the target project ID, current remote rules/indexes and the reviewed git
   commit. Confirm it is the test project and uses only synthetic accounts/data.
2. From the repository root, deploy only the reviewed Firestore rules/indexes
   using the pinned CLI, for example
   `./tools/firebase/node_modules/.bin/firebase deploy --only firestore:rules,firestore:indexes --project <verified-test-project>`.
3. Wait for indexes to become ready. Run the owner/non-owner and every actual
   client query smoke test there; record the exact commit, project and results.
4. A production deployment needs Hitesh's separate approval of that tested commit
   and an explicitly verified production target. No rule change should erase data
   or transfer ownership. Inspect legacy records for missing/incorrect `userId`
   before rollout; do not weaken ownership rules to hide a data problem.
5. To recover, redeploy the recorded previous reviewed rules/index configuration
   to the explicitly selected project, then repeat smoke tests. Rules rollback
   does not repair data or instantly restore deleted/rebuilding indexes. Preserve
   existing indexes until replacement indexes are ready and audit deletions first.

Firebase documentation:
[Rules tests](https://firebase.google.com/docs/rules/unit-tests),
[query authorization](https://firebase.google.com/docs/firestore/security/rules-query),
[emulator limitations](https://firebase.google.com/docs/emulator-suite/connect_firestore).

## Local app development

See [local Firebase development](local-firebase.md) for emulator start/seed/reset,
synthetic login, safe device routing and noninteractive login/CRUD smoke checks.
