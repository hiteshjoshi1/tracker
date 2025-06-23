# Tracker app

A React Native application with Firebase backend and Google Authentication.

## Tech stack
1. react-native
2. Firebase
3. Google Auth

## Getting Started

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
# Create debug APK
./gradlew assembleRelease
```
APK file will be in
`android/app/build/outputs/apk/release/app-release.apk`

Pair mac with Android and then use
Bluetooth File Exchange
app to transfer the apk to phone

## Additional Documentation
Some generated docs which are quite good
https://deepwiki.com/hiteshjoshi1/tracker/1-overview

## Development Tips
- Install dependencies with `npm install`.
- Run tests with `npm test`.
- Lint with `npm run lint`.
