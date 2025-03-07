
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    // Wrap the entire app with AuthProvider to make auth state available everywhere
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}

// import { Stack } from 'expo-router';
// import { AuthProvider } from '../context/AuthContext';

// export default function RootLayout() {
//   return (
//     // Wrap the entire app with AuthProvider to make auth state available everywhere
//     <AuthProvider>
//       <Stack
//         screenOptions={{
//           headerShown: false,
//         }}
//       />
//     </AuthProvider>
//   );
// }