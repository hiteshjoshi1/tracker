// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useGoogleAuth } from '../../services/authService';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { handleSignOut } = useGoogleAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          color: '#1F2937',
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        // Add sign out button to header
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleSignOut}
            style={{ marginRight: 16 }}
          >
            <FontAwesome name="sign-out" size={24} color="#7C3AED" />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome size={size} name="calendar" color={color} />
          ),
          headerTitle: 'Life Companion',
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome size={size} name="check-square" color={color} />
          ),
          headerTitle: 'Habits',
        }}
      />
    </Tabs>
  );
}