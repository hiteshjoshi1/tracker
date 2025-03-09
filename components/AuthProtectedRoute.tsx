import React, { ReactNode, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface AuthProtectedRouteProps {
  children: ReactNode;
}

/**
 * A component that protects routes by checking if the user is authenticated.
 * If not authenticated, redirects to the login screen.
 * Shows a loading indicator while checking authentication status.
 */
const AuthProtectedRoute: React.FC<AuthProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loadingMessage } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not authenticated, redirect to login
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login via the useEffect
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
});

export default AuthProtectedRoute;