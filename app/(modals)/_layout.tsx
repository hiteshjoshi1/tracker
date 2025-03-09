// app/(modals)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import AuthProtectedRoute from '../../components/AuthProtectedRoute';

export default function ModalsLayout() {
  return (
    <AuthProtectedRoute>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3498db',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="goals"
          options={{
            title: 'Goals',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="good-deeds"
          options={{
            title: 'Good Deeds',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="reflections"
          options={{
            title: 'Reflections',
            presentation: 'modal',
          }}
        />
      </Stack>
    </AuthProtectedRoute>
  );
}