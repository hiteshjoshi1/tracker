import { User } from 'firebase/auth';

// Basic user information in a more readable format
export interface UserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Auth response types
export interface GoogleAuthResponse {
  type: 'success' | 'error' | 'dismiss';
  params?: {
    id_token?: string;
    code?: string;
    [key: string]: any;
  };
  error?: Error;
}

// Authentication state
export interface AuthState {
  userInfo: User | null;
  isLoading: boolean;
  loadingMessage: string;
  isAuthenticated: boolean;
}

// Authentication actions
export type AuthAction = 
  | { type: 'SIGN_IN_START', payload: string }
  | { type: 'SIGN_IN_SUCCESS', payload: User }
  | { type: 'SIGN_IN_FAILURE', payload: string }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_LOADING', payload: { isLoading: boolean, message?: string } };

// Props for the AuthProvider component
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Context value type
export interface AuthContextValue {
  userInfo: User | null;
  isLoading: boolean;
  loadingMessage: string;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// Storage keys
export const USER_STORAGE_KEY = '@user';

// Error types
export enum AuthErrorType {
  SIGN_IN_CANCELLED = 'sign_in_cancelled',
  SIGN_IN_FAILED = 'sign_in_failed',
  NO_CREDENTIALS = 'no_credentials_received',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// Error messages
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  [AuthErrorType.SIGN_IN_CANCELLED]: 'Sign in was cancelled',
  [AuthErrorType.SIGN_IN_FAILED]: 'Authentication failed. Please try again.',
  [AuthErrorType.NO_CREDENTIALS]: 'No authentication credentials received from Google.',
  [AuthErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// Authentication provider configuration
export interface AuthProviderConfig {
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
  scopes?: string[];
  responseType?: 'token' | 'id_token';
  redirectUri?: string;
}

// Session data interface
export interface SessionData {
  user: UserInfo;
  lastLoginAt: number;
  expiresAt?: number;
}