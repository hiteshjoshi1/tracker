# Local Firebase development

Tracker's ordinary personal-use release remains `cd android && ./gradlew assembleRelease`,
followed by Bluetooth APK sideloading. A remote staging project and store publication
are not needed for the local testing described here. Firebase emulators use synthetic
`demo-tracker` data on your computer; they never select the personal Firebase backend.

## Start, seed and stop

Use Node 22 and Java 21 or later. From the repository root:

```bash
npm ci
npm ci --prefix tools/firebase
npm run emulators
```

In a second terminal, run `npm run emulators:seed`. This creates two deterministic
local accounts (`alice@tracker.test`, `bob@tracker.test`, password
`Tracker-local-only-123!`, UIDs `alice` and `bob`) and ten fixed-date records across
all five collections. The login screen's **LOCAL TEST: sign in as Alice** button
uses local password authentication; it never starts Google OAuth. No Google/Firebase
credentials are needed for this mode. Seed dates are deliberately fixed in January
2026; select that date in the journal, or create a fresh goal to see today's data.

`npm run emulators:reset` deletes only the local demo project's Auth users and
Firestore records. Seed again afterward. Both commands refuse real-project environment
variables and non-loopback server endpoints. They have no project/host override or
remote deployment option. Do not run reset or unattended tests while using a local
session whose test data you want to keep. Stop the foreground emulator process with
Ctrl-C; data is ephemeral and there is no automatic export/import of personal data.

## Connect the development app

In a dedicated development terminal, export the safe sample environment:

```bash
set -a
source .env.emulator.example
set +a
npx expo start --dev-client --localhost --clear
```

Build a debug development client with these same exported variables using
`npx expo run:android`. Do not run destructive `expo prebuild --clean`: the committed
native project contains the custom ScreenTime module.

For the Android emulator, change the two client endpoints to
`10.0.2.2:9099` and `10.0.2.2:8080` before starting/building the app. The server still
binds only to your computer's loopback address. For an iOS simulator or browser,
use `localhost:9099` and `localhost:8080`. iOS cleartext/ATS behavior still needs
platform validation; this sprint's transport/build checks focus on Android debug.

For a physical Android phone connected by USB debugging, use loopback client
endpoints and forward the emulator ports:

```bash
adb reverse tcp:9099 tcp:9099
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8081 tcp:8081
```

The last port is the development Metro server. Use `127.0.0.1` endpoints in the app;
no LAN binding, public tunnel or published APK is involved. On disconnect, local
requests fail: there is no production fallback. Remove forwards with
`adb reverse --remove tcp:9099` (and the corresponding 8080/8081 commands).

Only the existing Android **debug** manifest allows HTTP emulator connections.
This issue does not enable cleartext in release builds or create a second package
identity. Use an Android emulator for routine checks; until #34, a debug app has
the same package ID as your installed personal app and may replace it or fail due
to signing differences. A separately identified private test release is later work
(#34/#39), not a claim made by this change. Close the development terminal before
building your ordinary personal-data release from its normal environment.

## Safety and session isolation

Choose `EXPO_PUBLIC_FIREBASE_MODE=emulator` explicitly, with project `demo-tracker`
and both validated endpoints. The app and Expo config reject wrong/missing projects,
unknown modes, missing endpoints and arbitrary hosts/ports. Runtime checks run before
Firebase initialization. A development runtime selecting production is refused;
a normally configured local release remains production mode without requiring a new
build command. Neither a missing emulator nor failed login switches environments.

The local Firebase app has its own name, memory-only Auth and Firestore cache, and
`@tracker/emulator/demo-tracker/user` UI cache. It neither reads nor writes the
production app's `@user` session. Restarting the local app requires local login;
production credentials, Google OAuth and personal data are not used.

Notifications are disabled in emulator mode: no remote push registration, permission
prompts, notification scheduling/cancellation, response listeners or shared notification
ID writes occur. This prevents the local account from cancelling personal reminders
while package identity is shared. Notification device tests resume with a separately
identified test app in #34/#38.

## Unattended smoke checks

`npm run test:local` starts Auth/Firestore emulators, runs guard/order and real
synthetic login/logout, owner CRUD, filtered listener, cross-user isolation and
reset/reseed checks, and stops the emulators on completion/failure. It is suitable
for noninteractive local/CI use, with no real credentials. Run it separately from
`npm run test:rules`, which also owns port 8080 and clears its fixtures. Java must
be available; emulator binaries may download on the first run. A successful Node
smoke test is not physical phone evidence.

For a manual device check, record device/OS, exact commit/build, local login,
owner CRUD/listener behavior and offline/reconnect results. No physical-device
result is claimed by these instructions. Firebase emulator limitations (including
missing production index enforcement) still apply; see [Firebase policy](firebase.md).
