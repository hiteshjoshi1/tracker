// // authServiceNative.ts
// // services/authService.ts

// import { Platform } from 'react-native';
// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';
// import { 
//   GoogleAuthProvider, 
//   signInWithCredential, 
//   signOut as firebaseSignOut,
//   User 
// } from 'firebase/auth';
// import { auth } from '../config/firebase';
// import { useState } from 'react';

// // Initialize browser completion handling
// WebBrowser.maybeCompleteAuthSession();

// // Global promise to track auth completion - outside component lifecycle
// let authPromise: Promise<User | null> | null = null;

// export const useGoogleAuth = () => {
//   const [isLoading, setIsLoading] = useState(false);

//   // Use your existing auth request
//   const [request, response, promptAsync] = Google.useAuthRequest({
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
//     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
//     scopes: ['profile', 'email', 'openid'],
//     redirectUri: Platform.select({
//       android: 'com.hiteshjoshi.tracker:/oauthredirect',
//       web: 'https://auth.expo.io/@hiteshjoshi/Tracker',
//       ios: 'com.hiteshjoshi.tracker:/oauthredirect'
//     })
//   });

//   async function exchangeCodeForTokens(code: string) {
//     const response = await fetch('https://oauth2.googleapis.com/token', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         code,
//         client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!, // Use web client ID
//         client_secret: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET!, // DANGER: Don’t store this client-side in production
//         redirect_uri: 'com.hiteshjoshi.tracker:/oauthredirect',
//         grant_type: 'authorization_code',
//       }).toString(),
//     });
  
//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error(`Token exchange failed: ${data.error_description || 'Unknown error'}`);
//     }
//     return data; // { id_token, access_token, refresh_token, expires_in }
//   }
  
//   const signInWithGoogle = async () => {
//     // If an authentication process is already in progress, return the existing promise
//     if (authPromise) {
//       console.log('Returning existing auth promise');
//       return authPromise;
//     }
    
//     // Set loading state
//     setIsLoading(true);
//     console.log('Starting Google Sign In');
    
//     // Create a new promise chain and store it globally
//     authPromise = (async () => {
//       try {
//         if (!request) {
//           console.log('Request not ready');
//           return null;
//         }
    
//         console.log('Starting auth prompt...');
//         const result = await promptAsync();
        
//         // This log should now appear even after component remounts
//         console.log('Auth prompt completed with result:', JSON.stringify(result));
        
//         if (result?.type === 'success') {
     
           
//             try {

//                 const { id_token } = result.params; // Use id_token instead of code
//                 console.log('Got ID token:', id_token);
//                 const credential = GoogleAuthProvider.credential(id_token);
//                 console.log('Attempting Firebase sign in...');
//               const userCredential = await signInWithCredential(auth, credential);
//               console.log('Firebase sign in successful:', userCredential.user.uid);
//               return userCredential.user;
//             } catch (firebaseError) {
//               console.error('Firebase sign in failed:', firebaseError);
//               throw firebaseError;
//             }
//           }
//         else {
//           console.log('Auth was not successful:', result);
//           throw new Error(`Authentication failed: ${result?.type}`);
//         }
//       } catch (error) {
//         console.error('Auth promise error:', error);
//         throw error;
//       } finally {
//         // Clear the global promise when done (success or failure)
//         authPromise = null;
//         setIsLoading(false);
//       }
//     })();
    
//     return authPromise;
//   };

//   const handleSignOut = async () => {
//     try {
//       await firebaseSignOut(auth);
//       console.log('Signed out successfully');
//     } catch (error) {
//       console.error('Sign out error:', error);
//       throw error;
//     }
//   };

//   return {
//     signInWithGoogle,
//     handleSignOut,
//     isLoading,
//   };
// };



// // import { Platform } from 'react-native';
// // import * as Google from 'expo-auth-session/providers/google';
// // import * as WebBrowser from 'expo-web-browser';
// // import { AuthSessionResult } from 'expo-auth-session';

// // import { 
// //   GoogleAuthProvider, 
// //   signInWithCredential, 
// //   signOut 
// // } from 'firebase/auth';
// // import { auth } from '../config/firebase';
// // import { useState } from 'react';



// // WebBrowser.maybeCompleteAuthSession();

// // // Store auth results outside of component to preserve across remounts
// // //test
// // let lastAuthResult: AuthSessionResult | null = null;


// // export const useGoogleAuth = () => {
// //   const [isLoading, setIsLoading] = useState(false);

// //   // Simplified configuration for Google Auth
// //   const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
// //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
// //     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
// //     scopes: [
// //       'profile','email', 'openid'
// //       ],
// //     responseType: "code",
// //     redirectUri: Platform.select({
// //         web: 'https://auth.expo.io/@hiteshjoshi/Tracker',
// //         android: 'com.hiteshjoshi.tracker:/oauthredirect'
// //       })
// //   });


// //     // Check if we have a response from a previous attempt
// //     if (response && !lastAuthResult) {
// //         console.log('Found auth response from previous prompt:', response.type);
// //         lastAuthResult = response;
// //       }

  
// //   const signInWithGoogle = async () => {
// //     try {
// //       setIsLoading(true);
// //       console.log('Starting Google Sign In');
      
// //       if (!request) {
// //         console.log('Request not ready');
// //         return;
// //       }
  
// //       console.log('Starting auth prompt...', new Date().toISOString());
      
// //       let result = lastAuthResult;
      
// //       // If not, prompt the user
// //       if (!result) {
// //         result = await promptAsync();
// //         console.log('Auth prompt completed');
// //         lastAuthResult = result; // Save for potential remount
// //       }
      
// //       console.log('Processing auth result:', result?.type);
      
// //       if (result?.type === 'success') {
// //         const { code } = result.params;
// //         console.log('Got authorization code');
        
  
// //         try {
// //               // Create credential with the code
// //               const credential = GoogleAuthProvider.credential(null, code);
// //               console.log('Created credential, signing in to Firebase');
// //               const userCredential = await signInWithCredential(auth, credential);
        
// //           console.log('Firebase sign in successful:', userCredential.user.uid);
// //           return userCredential.user;
// //         } catch (firebaseError) {
// //           console.error('Firebase sign in failed:', firebaseError);
// //           throw firebaseError;
// //         }
// //       } else {
// //         console.log('Auth was not successful:', result?.type);
// //         throw new Error(`Authentication failed: ${result?.type}`);
// //       }
// //     } catch (error) {
// //       console.error('Top level Google sign in error:', error);
// //       throw error;
// //     } finally {
// //       console.log('Sign in process completed', new Date().toISOString());
// //       setIsLoading(false);
// //     }
// //   };


// //         // Create Firebase credential
// //     //     const credential = GoogleAuthProvider.credential(null, code);
        
// //     //     try {
// //     //         const userCredential = await signInWithCredential(auth, credential);
// //     //         console.log('Firebase auth successful:', userCredential.user.uid);
// //     //         return userCredential.user;
// //     //       } catch (firebaseError) {
// //     //         console.error('Firebase auth error:', firebaseError);
// //     //         throw firebaseError;
// //     //       }
// //     //     } else {
// //     //       console.log('Authentication failed:', result);
// //     //     }
// //     //   } catch (error) {
// //     //     console.error('Google sign in error:', error);
// //     //     throw error;
// //     //   } finally {
// //     //     setIsLoading(false);
// //     //   }
// //     // };

// //   const handleSignOut = async () => {
// //     try {
// //       await signOut(auth);
// //       lastAuthResult = null; 
// //     } catch (error) {
// //       console.error('Sign out error:', error);
// //       throw error;
// //     }
// //   };

// //   return {
// //     signInWithGoogle,
// //     handleSignOut,
// //     isLoading,
// //   };
// // };

// // // // // // src/services/authService.ts
// // // // src/services/authService.ts
// // // import { Platform } from 'react-native';
// // // import * as AuthSession from 'expo-auth-session';
// // // import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
// // // import { auth } from '../config/firebase';
// // // import * as Google from 'expo-auth-session/providers/google';
// // // import * as WebBrowser from 'expo-web-browser';
// // // import { useState } from 'react';

// // // WebBrowser.maybeCompleteAuthSession();


// // // export const useGoogleAuth = () => {
// // //   const [isLoading, setIsLoading] = useState(false);

// // // const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
// // //     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
// // //     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
// // //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
// // //     clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
// // //     scopes: [
// // //       'https://www.googleapis.com/auth/userinfo.profile',
// // //       'https://www.googleapis.com/auth/userinfo.email'
// // //     ],
// // //     responseType: "id_token",
// // //     usePKCE: Platform.select({
// // //       web: false,
// // //       default: true
// // //     }),
// // //     extraParams: {
// // //       access_type: 'offline',
// // //       prompt: 'consent'
// // //     }
// // //   });

// // // // Add these debug logs
// // // console.log('Auth Request:', request);
// // // console.log('Auth Response:', response);
// // // console.log('Platform:', Platform.OS);
// // // console.log('Redirect URI:', request?.redirectUri);


// // //   const signInWithGoogle = async () => {
// // //     try {
// // //       setIsLoading(true);
// // //       console.log('Starting Google Sign In');
      
// // //       if (!request) {
// // //         console.log('Request not ready');
// // //         return;
// // //       }

// // //       const result = await promptAsync();
// // //       console.log('Auth Result:', result);
      
// // //       if (result?.type === 'success') {
// // //         const { id_token } = result.params;  // Changed from id_token
// // //         const credential = GoogleAuthProvider.credential(id_token);
// // //         const userCredential = await signInWithCredential(auth, credential);
// // //         return userCredential.user;
// // //       } else {
// // //         console.log('Authentication failed:', result);
// // //       }
// // //     } catch (error) {
// // //       console.error('Google sign in error:', error);
// // //       throw error;
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   };

// // //   const handleSignOut = async () => {
// // //     try {
// // //       await signOut(auth);
// // //     } catch (error) {
// // //       console.error('Sign out error:', error);
// // //       throw error;
// // //     }
// // //   };

// // //   return {
// // //     signInWithGoogle,
// // //     handleSignOut,
// // //     isLoading,
// // //   };
// // // };
