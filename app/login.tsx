//app/logim.tsx

import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

const LoginScreen = () => {
  // Use the authentication context instead of local state
  const { isLoading, loadingMessage, signInWithGoogle, isAuthenticated } = useAuth();

  // Redirect to tabs if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
        router.replace('/today');
    }
  }, [isAuthenticated]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={['#4a90e2', '#357abd']}
        style={styles.background}
      />
      <View style={styles.logoContainer}>
        <Text style={styles.appTitle}>Daily Journal</Text>
        <Text style={styles.appSubtitle}>Track your daily goals and habits</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={signInWithGoogle}
          >
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#FFF',
  },
});

export default LoginScreen;


// import React, { useState, useEffect } from 'react';
// import { 
//   StyleSheet, 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   Image, 
//   Alert, 
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform
// } from 'react-native';
// import { router } from 'expo-router';
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { 
//   GoogleAuthProvider, 
//   signInWithCredential, 
//   onAuthStateChanged 
// } from 'firebase/auth';
// import { auth, googleAuthProvider } from '../config/firebase';
// import { LinearGradient } from 'expo-linear-gradient';
// import Constants from 'expo-constants';

// // Register for redirect callback
// WebBrowser.maybeCompleteAuthSession();

// const LoginScreen = () => {
//   const [userInfo, setUserInfo] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [loadingMessage, setLoadingMessage] = useState<string>('');

//   // Setup Google Auth Request
// //   const [request, response, promptAsync] = Google.useAuthRequest({
// //     androidClientId: Constants.expoConfig?.extra?.androidClientId,
// //     webClientId: Constants.expoConfig?.extra?.webClientId,
// //     responseType: 'id_token',
// //     selectAccount: true,
// //   });

// const [request, response, promptAsync] = Google.useAuthRequest({
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
//     scopes: ['profile', 'email', 'openid'],
//     redirectUri: Platform.select({
//       android: 'com.hiteshjoshi.tracker:/oauthredirect',
//       web: 'https://auth.expo.io/@hiteshjoshi/Tracker',
//       ios: 'com.hiteshjoshi.tracker:/oauthredirect'
//     })
//   });

//   // Check for existing session on mount
//   useEffect(() => {
//     const checkExistingSession = async () => {
//       try {
//         const userJSON = await AsyncStorage.getItem('@user');
//         if (userJSON) {
//           const userData = JSON.parse(userJSON);
//           setUserInfo(userData);
//           // Navigate to home screen if user is already logged in
//           router.replace('/(tabs)');
//         }
//       } catch (error) {
//         console.error('Error checking existing session:', error);
//       }
//     };

//     checkExistingSession();

//     // Monitor Firebase auth state
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         console.log('User is signed in:', user.uid);
//         // User is signed in
//         setUserInfo(user);
//         saveUserToStorage(user);
//         if (isLoading) {
//           setIsLoading(false);
//           router.replace('/(tabs)');
//         }
//       } else {
//         // User is signed out
//         console.log('User is signed out');
//         setUserInfo(null);
//         AsyncStorage.removeItem('@user');
//       }
//     });

//     // Cleanup subscription
//     return () => unsubscribe();
//   }, []);

//   // Handle Google Auth Response
//   useEffect(() => {
//     if (response?.type === 'success') {
//       setIsLoading(true);
//       setLoadingMessage('Getting user info...');
//       handleGoogleSignInResponse(response);
//     } else if (response?.type === 'error' || response?.type === 'dismiss') {
//       setIsLoading(false);
//       Alert.alert('Authentication failed', 'Google sign in was unsuccessful. Please try again.');
//     }
//   }, [response]);

//   const handleGoogleSignInResponse = async (response: any) => {
//     try {
//       console.log('Got authentication response:', response.type);
      
//       if (response.type === 'success') {
//         // Check if we have an id_token (using responseType: 'id_token')
//         if (response.params.id_token) {
//           const { id_token } = response.params;
//           console.log('Received ID token from Google Auth');
          
//           setLoadingMessage('Authenticating with Firebase...');
//           // Create a Google credential with ID token
//           const credential = GoogleAuthProvider.credential(id_token);
          
//           // Sign in to Firebase with the Google credential
//           const result = await signInWithCredential(auth, credential);
//           console.log('Firebase sign in successful:', result.user.uid);
          
//           // Save user data
//           const userData = {
//             uid: result.user.uid,
//             email: result.user.email,
//             displayName: result.user.displayName,
//             photoURL: result.user.photoURL
//           };
          
//           setUserInfo(userData);
//           saveUserToStorage(userData);
          
//           // Navigate to home screen
//           setLoadingMessage('Redirecting to app...');
//           router.replace('/(tabs)');
//         } 
//         // If we got an authorization code instead (default responseType)
//         else if (response.params.code) {
//           console.log('Received authorization code from Google Auth');
//           Alert.alert(
//             'Authorization Code Flow',
//             'Received an authorization code instead of an ID token. ' +
//             'Please update the configuration to use responseType: "id_token".'
//           );
//           setIsLoading(false);
//           return;
//         } else {
//           console.error('No id_token or code found in response');
//           setIsLoading(false);
//           Alert.alert('Authentication Error', 'No authentication credentials received from Google.');
//           return;
//         }
//       }
//     } catch (error) {
//       console.error('Error signing in with Google:', error);
//       setIsLoading(false);
//       Alert.alert('Authentication Error', 'An error occurred during Google sign in. Please try again.');
//     }
//   };

//   const saveUserToStorage = async (user: any) => {
//     try {
//       await AsyncStorage.setItem('@user', JSON.stringify(user));
//     } catch (error) {
//       console.error('Error saving user to storage:', error);
//     }
//   };

//   const handleGoogleSignIn = async () => {
//     setIsLoading(true);
//     setLoadingMessage('Opening Google Sign In...');
//     try {
//       await promptAsync();
//     } catch (error) {
//       console.error('Error opening Google Sign In:', error);
//       setIsLoading(false);
//       Alert.alert('Sign In Error', 'Could not open Google Sign In. Please try again.');
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={styles.container}
//     >
//       <LinearGradient
//         colors={['#4a90e2', '#357abd']}
//         style={styles.background}
//       />
//       <View style={styles.logoContainer}>
//         <Text style={styles.appTitle}>Daily Journal</Text>
//         <Text style={styles.appSubtitle}>Track your daily goals and habits</Text>
//       </View>

//       {isLoading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#FFFFFF" />
//           <Text style={styles.loadingText}>{loadingMessage}</Text>
//         </View>
//       ) : (
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity 
//             style={styles.googleButton}
//             onPress={handleGoogleSignIn}
//             disabled={!request}
//           >
//             <Text style={styles.buttonText}>Sign in with Google</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   background: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     top: 0,
//     bottom: 0,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 60,
//   },
//   appTitle: {
//     fontSize: 36,
//     fontWeight: 'bold',
//     color: '#FFF',
//     marginBottom: 10,
//   },
//   appSubtitle: {
//     fontSize: 18,
//     color: 'rgba(255,255,255,0.8)',
//     textAlign: 'center',
//   },
//   buttonContainer: {
//     width: '100%',
//     alignItems: 'center',
//   },
//   googleButton: {
//     backgroundColor: '#FFF',
//     padding: 16,
//     borderRadius: 12,
//     width: '100%',
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   buttonText: {
//     color: '#4a90e2',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#FFF',
//   },
// });

// export default LoginScreen;