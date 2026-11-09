import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, memoryLocalCache, persistentLocalCache, persistentSingleTabManager, Firestore } from 'firebase/firestore';
import { initializeAuth, getAuth, connectAuthEmulator, inMemoryPersistence, GoogleAuthProvider, getReactNativePersistence, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { initializeFirebase } = require('./firebaseEnvironment.cjs');
const client = initializeFirebase(Constants.expoConfig?.extra || {}, {
  isDevelopment: typeof __DEV__ !== 'undefined' && __DEV__,
  platform: Platform.OS,
}, {
  initializeApp, getApps, getAuth, getFirestore, initializeAuth, initializeFirestore,
  connectAuthEmulator, connectFirestoreEmulator, inMemoryPersistence, memoryLocalCache,
  productionAuth: (app: FirebaseApp) => Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }),
  productionCache: () => {
    try {
      return { experimentalForceLongPolling: Platform.OS === 'android', localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: true }) }) };
    } catch {
      return { experimentalForceLongPolling: Platform.OS === 'android', localCache: memoryLocalCache() };
    }
  },
});
export const app: FirebaseApp = client.app;
export const db: Firestore = client.db;
export const auth: Auth = client.auth;
export const isEmulator = client.environment.mode === 'emulator';
export const userStorageKey: string = client.environment.userStorageKey;
export const googleAuthProvider = new GoogleAuthProvider();
