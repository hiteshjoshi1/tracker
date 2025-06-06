// // app/config/firebase.ts

// app/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore,memoryLocalCache, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { 
  initializeAuth, 
  getAuth, 
  GoogleAuthProvider,
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};


// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let cacheConfig;
try {
  cacheConfig = {
    experimentalForceLongPolling: Platform.OS === 'android',
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager({ forceOwnership: true })
    })
  };
} catch (e) {
  console.log('Falling back to memory cache for Firestore');
  cacheConfig = {
    experimentalForceLongPolling: Platform.OS === 'android',
    localCache: memoryLocalCache()
  };
}

const db = initializeFirestore(app, cacheConfig);

// Initialize Auth based on platform
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

export const googleAuthProvider = new GoogleAuthProvider();

export { app, db, auth };
