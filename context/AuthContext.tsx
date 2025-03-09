import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

// Register for redirect callback
WebBrowser.maybeCompleteAuthSession();

// Define types for our context
type UserInfo = User | null | undefined;

interface AuthContextType {
  userInfo: UserInfo;
  isLoading: boolean;
  loadingMessage: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  userInfo: null,
  isLoading: false,
  loadingMessage: '',
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

// Create a provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check for existing session
  const [loadingMessage, setLoadingMessage] = useState<string>('Checking login status...');
  
  // Setup Google Auth Request
  // This is moved from login.tsx to the context for better reusability
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email', 'openid'],
    redirectUri: Platform.select({
      android: 'com.hiteshjoshi.tracker:/oauthredirect',
      web: 'https://auth.expo.io/@hiteshjoshi/Tracker',
      ios: 'com.hiteshjoshi.tracker:/oauthredirect'
    })
  });

  // Check for existing session and set up auth state listener
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if there's stored user data
        const userJSON = await AsyncStorage.getItem('@user');
        if (userJSON) {
          const userData = JSON.parse(userJSON);
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
      } finally {
        // Always finish loading after checking, even if there's an error
        setIsLoading(false);
      }
    };

    // Monitor Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user.uid);
        setUserInfo(user);
        saveUserToStorage(user);
      } else {
        console.log('User is signed out');
        setUserInfo(null);
        // Clear stored user data
        AsyncStorage.removeItem('@user');
      }
      // Update loading state
      setIsLoading(false);
    });

    // Check for existing session
    checkExistingSession();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      setIsLoading(true);
      setLoadingMessage('Getting user info...');
      handleGoogleSignInResponse(response);
    } else if (response?.type === 'error' || response?.type === 'dismiss') {
      setIsLoading(false);
      Alert.alert('Authentication failed', 'Google sign in was unsuccessful. Please try again.');
    }
  }, [response]);

  // Save user data to AsyncStorage
  const saveUserToStorage = async (user: any) => {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  // Process Google sign-in response
  const handleGoogleSignInResponse = async (response: any) => {
    try {
      console.log('Got authentication response:', response.type);
      
      if (response.type === 'success') {
        // Check if we have an id_token (using responseType: 'id_token')
        if (response.params.id_token) {
          const { id_token } = response.params;
          console.log('Received ID token from Google Auth');
          
          setLoadingMessage('Authenticating with Firebase...');
          // Create a Google credential with ID token
          const credential = GoogleAuthProvider.credential(id_token);
          
          // Sign in to Firebase with the Google credential
          const result = await signInWithCredential(auth, credential);
          console.log('Firebase sign in successful:', result.user.uid);
          
          // Save user data
          setUserInfo(result.user);
          saveUserToStorage(result.user);
          
          // Navigate to home screen
          setLoadingMessage('Redirecting to app...');
          router.replace('/today');
          return null;
        } 
        // If we got an authorization code instead (default responseType)
        else if (response.params.code) {
          console.log('Received authorization code from Google Auth');
          Alert.alert(
            'Authorization Code Flow',
            'Received an authorization code instead of an ID token. ' +
            'Please update the configuration to use responseType: "id_token".'
          );
          setIsLoading(false);
        } else {
          console.error('No id_token or code found in response');
          setIsLoading(false);
          Alert.alert('Authentication Error', 'No authentication credentials received from Google.');
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setIsLoading(false);
      Alert.alert('Authentication Error', 'An error occurred during Google sign in. Please try again.');
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setLoadingMessage('Opening Google Sign In...');
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error opening Google Sign In:', error);
      setIsLoading(false);
      Alert.alert('Sign In Error', 'Could not open Google Sign In. Please try again.');
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    setLoadingMessage('Signing out...');
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('@user');
      setUserInfo(null);
      // Navigate to login screen
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Sign Out Error', 'Could not sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        isLoading,
        loadingMessage,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!userInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);