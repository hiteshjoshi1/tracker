// app/(auth)/login.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  const handleSignIn = async () => {
    try {
      console.log('In sign in');  
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Tracker</Text>
        <Text style={styles.subtitle}>Sign in to start tracking your goals</Text>
        
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});