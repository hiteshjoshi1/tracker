# Tracker app

A React Native application with Firebase backend and Google Authentication.

Engineering work is tracked in the [Tracker backlog](https://github.com/users/hiteshjoshi1/projects/3).
Read [CONTRIBUTING.md](CONTRIBUTING.md) for issue, branch, PR and verification requirements.

## Tech stack
1. react-native
2. Firebase
3. Google Auth
4. Node version pinned in `.nvmrc`

## Getting Started
```bash
nvm install
nvm use
npm ci
```

Use the committed lockfiles for regular installs. If the Firebase emulator tools
from this sprint are present, also run `npm ci --prefix tools/firebase`.
See [dependency updates](docs/dependency-updates.md) for update and compatibility checks.

First copy the example environment file and replace the placeholder values with your own credentials:

```bash
cp .env.example .env
# then edit .env and add your Firebase/Google values
```

### Build locally and test
```bash
npx expo run:android
```

### To clean and rebuild
```bash
npx expo prebuild --clean && npx expo run:android
```

### Build for device (apk)
- expo always has googleservices.json issue for local as well as remote
```bash
cd android
# Create the release APK for private installation
./gradlew assembleRelease
```
APK file will be in
`android/app/build/outputs/apk/release/app-release.apk`

Pair mac with Android and then use
Bluetooth File Exchange
app to transfer the apk to phone. Tracker is installed privately; this does not
publish it to an app store.

## Additional Documentation
Some generated docs which are quite good
https://deepwiki.com/hiteshjoshi1/tracker/1-overview

## Development Tips
- Install dependencies with `npm ci` (and `npm ci --prefix tools/firebase` when the tools project is present).
- Run tests with `npm test`.
- Lint with `npm run lint`.

### Running Tests
Execute the unit test suite with:

```bash
npm test
```

For watch mode during development use:

```bash
npm run test:watch
```
