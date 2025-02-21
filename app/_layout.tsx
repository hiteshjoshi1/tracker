import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { router } from 'expo-router';

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}


// app/_layout.tsx
// import { useEffect } from 'react';
// import { Slot, useRouter, useSegments } from 'expo-router';
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../config/firebase';

// export default function RootLayout() {
//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       const inAuthGroup = segments[0] === '(auth)';
      
//       if (!user && !inAuthGroup) {
//         // Not signed in, redirect to login
//         router.replace('/login');
//       } else if (user && inAuthGroup) {
//         // Signed in, redirect to main app
//         router.replace('/(tabs)');
//       }
//     });

//     return () => unsubscribe();
//   }, [segments]);

//   return <Slot />;
// }

// // app/_layout.tsx
// import { useEffect } from 'react';
// import { Slot, useRouter, useSegments } from 'expo-router';
// import { auth } from '../config/firebase';

// export default function RootLayout() {
//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       const inTabsGroup = segments[0] === '(tabs)';
      
//       if (!user && inTabsGroup) {
//         // Redirect to login if user is not authenticated and trying to access tabs
//         router.replace('/login');
//       } else if (user && !inTabsGroup) {
//         // Redirect to tabs if user is authenticated and not in tabs
//         router.replace('/(tabs)');
//       }
//     });

//     return unsubscribe;
//   }, [segments]);

//   return <Slot />;
// }
