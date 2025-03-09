import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AuthProtectedRoute from '../../components/AuthProtectedRoute';

export default function TabsLayout() {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Sign Out", 
          onPress: () => signOut(),
          style: "destructive"
        }
      ]
    );
  };

  // Create logout button component for header
  const LogoutButton = () => (
    <TouchableOpacity 
      onPress={handleLogout}
      style={{ marginRight: 16 }}
    >
      <Ionicons name="log-out-outline" size={24} color="#3498db" />
    </TouchableOpacity>
  );

  return (
    <AuthProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: '#95a5a6',
          // Add logout button to all screen headers
          headerRight: () => <LogoutButton />
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="today-outline" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="habits"
          options={{
            title: "Habits",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        
        {/* Add your future tabs here */}
        {/* 
        <Tabs.Screen
          name="quotes"
          options={{
            title: "Quotes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics-outline" size={size} color={color} />
            ),
          }}
        />
        */}
      </Tabs>
    </AuthProtectedRoute>
  );
}