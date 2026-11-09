//app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';
const { resolveEnvironment } = require('./config/firebaseEnvironment.cjs');
const firebaseExtra = {
  firebaseMode: process.env.EXPO_PUBLIC_FIREBASE_MODE || 'production',
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseAuthEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
  firebaseFirestoreEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST,
};
// Expo config evaluation must reject invalid local choices before packaging them.
const firebaseEnvironment = resolveEnvironment(firebaseExtra);


export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Tracker",
  slug: "Tracker",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "tracker", // Only define scheme once here
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/images/adaptive-icon.png"
      }
    ]
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.hiteshjoshi.tracker",
    ...(firebaseEnvironment.mode === 'emulator' ? {} : {
      googleServicesFile: "./GoogleService-Info.plist",
    }),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.hiteshjoshi.tracker",
    ...(firebaseEnvironment.mode === 'emulator' ? {} : {
      googleServicesFile: "./google-services.json",
    }),
    versionCode: 1,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "tracker",
            host: "*"
          }
        ],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  experiments: {
    typedRoutes: true
  },
  extra: {
    ...firebaseExtra,
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    },
    enableDebugLogging: true
  }
});
