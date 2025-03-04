Tracker app

1. react-native
2. Firebase
3. Google Auth

Build locally and test



Build for device (apk)
- expo always has googleservices.json issue for local as well as remote
cd android

# Create debug APK
./gradlew assembleRelease

APK file will be in
android/app/build/outputs/apk/debug/app-debug.apk

Pair mac with Android and then use
Bluetooth File Exchange
app to transfer the apk to phone