// app/quote/_layout.tsx
import { Stack } from 'expo-router';
import AuthProtectedRoute from '../../components/AuthProtectedRoute';

export default function QuoteLayout() {
  return (
    <AuthProtectedRoute>
      <Stack>
        <Stack.Screen
          name="add"
          options={{
            title: 'Add Quote',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            title: 'Edit Quote',
            presentation: 'card',
          }}
        />
      </Stack>
    </AuthProtectedRoute>
  );
}