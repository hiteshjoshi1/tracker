import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

export default function Index() {
  // Main app entry point - redirect to tabs if logged in, login page if not
  const user = auth.currentUser;
  
  if (user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}