//app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Tracker",
  slug: "Tracker",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "tracker", // Only define scheme once here
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.hiteshjoshi.tracker", // Add this
    googleServicesFile: "./GoogleService-Info.plist", // Add this if using Firebase
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.hiteshjoshi.tracker",
    googleServicesFile: "./google-services.json",
    versionCode: 1 ,
        // Add this if not present
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
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    },
    enableDebugLogging: true
  }
});
