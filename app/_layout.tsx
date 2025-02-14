
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
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
        name="goals"  // Changed from 'journal' to 'goals' to match the file name
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome size={size} name="book" color={color} />
          ),
          headerTitle: 'Goals',
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
