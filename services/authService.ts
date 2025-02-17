// // // src/services/authService.ts
// src/services/authService.ts
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

WebBrowser.maybeCompleteAuthSession();


export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    responseType: "id_token",
    usePKCE: Platform.select({
      web: false,
      default: true
    }),
    redirectUri: Platform.select({
      web: undefined,
      default: 'https://auth.expo.io/@hiteshjoshi/Tracker'
    }),
    // Add these options
    extraParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  });

// Add these debug logs
console.log('Auth Request:', request);
console.log('Auth Response:', response);
console.log('Platform:', Platform.OS);
console.log('Redirect URI:', request?.redirectUri);


  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google Sign In');
      
      if (!request) {
        console.log('Request not ready');
        return;
      }

      const result = await promptAsync();
      console.log('Auth Result:', result);
      
      if (result?.type === 'success') {
        const { id_token } = result.params;  // Changed from id_token
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      } else {
        console.log('Authentication failed:', result);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    handleSignOut,
    isLoading,
  };
};
