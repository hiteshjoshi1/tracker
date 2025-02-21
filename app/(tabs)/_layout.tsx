import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { TouchableOpacity, Alert } from 'react-native';
import { auth } from '../../config/firebase';

export default function TabsLayout() {
  useEffect(() => {
    // Set up auth state listener for tabs
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If user signs out or no user is found, redirect to login
      if (!user) {
        console.log('No user found in tabs layout, redirecting to login');
        router.replace('/login');
      }
    });

    // Check if user exists in AsyncStorage
    const checkUser = async () => {
      const userJSON = await AsyncStorage.getItem('@user');
      if (!userJSON) {
        console.log('No user in AsyncStorage, redirecting to login');
        router.replace('/login');
      }
    };

    checkUser();

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('Logging out user');
              // Sign out from Firebase
              await signOut(auth);
              // Clear AsyncStorage user data
              await AsyncStorage.removeItem('@user');
              // Navigate to login
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4a90e2',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      ),
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
// // app/(tabs)/_layout.tsx
// import { Tabs } from 'expo-router';
// import { useColorScheme, Platform, TouchableOpacity } from 'react-native';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import { useGoogleAuth } from '../../services/authService';
// import { useRouter } from 'expo-router';

// export default function TabLayout() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   // const { handleSignOut } = useGoogleAuth();

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: '#7C3AED',
//         tabBarInactiveTintColor: '#6B7280',
//         headerShown: true,
//         tabBarStyle: {
//           backgroundColor: '#FFFFFF',
//           borderTopColor: '#E5E7EB',
//           height: Platform.OS === 'ios' ? 88 : 60,
//           paddingBottom: Platform.OS === 'ios' ? 28 : 8,
//           paddingTop: 8,
//         },
//         headerStyle: {
//           backgroundColor: '#FFFFFF',
//           elevation: 0,
//           shadowOpacity: 0,
//           borderBottomWidth: 1,
//           borderBottomColor: '#E5E7EB',
//         },
//         headerTitleStyle: {
//           color: '#1F2937',
//           fontWeight: 'bold',
//           fontSize: 18,
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: '500',
//         },
//         // Add sign out button to header
//         headerRight: () => (
//           <TouchableOpacity 
//             onPress={handleSignOut}
//             style={{ marginRight: 16 }}
//           >
//             <FontAwesome name="sign-out" size={24} color="#7C3AED" />
//           </TouchableOpacity>
//         ),
//       }}>
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: 'Today',
//           tabBarIcon: ({ color, size }) => (
//             <FontAwesome size={size} name="calendar" color={color} />
//           ),
//           headerTitle: 'Life Companion',
//         }}
//       />
//       <Tabs.Screen
//         name="habits"
//         options={{
//           title: 'Habits',
//           tabBarIcon: ({ color, size }) => (
//             <FontAwesome size={size} name="check-square" color={color} />
//           ),
//           headerTitle: 'Habits',
//         }}
//       />
//     </Tabs>
//   );
// }