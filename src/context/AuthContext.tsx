import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { AuthResponse, AuthUser } from '../services/auth';
import { login as loginApi, register as registerApi, loginWithGoogle as loginWithGoogleApi } from '../services/auth';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const AUTH_USER_KEY = 'AUTH_USER';
//test_app_bỏ_qua_login
// const mockAuthResponse = ({
//   fullName,
//   email,
// }: {
//   fullName?: string;
//   email: string;
// }): AuthResponse => ({
//   token: 'mock-token',
//   user: {
//     id: 'mock-user',
//     name: fullName ?? email.split('@')[0] ?? 'Người dùng',
//     email,
//   },
// });

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  setAuthDataFromOTP: (authData: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getSavedAuth() {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const userJson = await SecureStore.getItemAsync(AUTH_USER_KEY);
  if (!userJson) {
    return { token, user: null };
  }

  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { token, user };
  } catch {
    return { token, user: null };
  }
}

async function saveAuthData(response: AuthResponse) {
  const token = typeof response.token === 'string' ? response.token : JSON.stringify(response.token);
  const userString = JSON.stringify(response.user ?? {});

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, userString);
}

async function clearAuthData() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      const savedAuth = await getSavedAuth();
      if (savedAuth?.token) {
        setToken(savedAuth.token);
        setUser(savedAuth.user);
      }
      setInitialized(true);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await loginApi(email, password);
    await saveAuthData(response);
    setToken(response.token);
    setUser(response.user);
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    console.log('📝 signUp: Gọi registerApi', { fullName, email, password });
    try {
      const result = await registerApi(fullName, email, password);
      console.log('✅ signUp: Đăng ký thành công', result);
      // Don't save auth data yet - wait for OTP verification
    } catch (error) {
      console.error('❌ signUp: Lỗi registerApi', error);
      throw error;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    const response = await loginWithGoogleApi(idToken);
    await saveAuthData(response);
    setToken(response.token);
    setUser(response.user);
  };

  const setAuthDataFromOTP = async (authData: AuthResponse) => {
    await saveAuthData(authData);
    setToken(authData.token);
    setUser(authData.user);
  };

  const signOut = async () => {
    try {
      // Sign out from Google if signed in with Google
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google Sign-out failed:', error);
    }

    await clearAuthData();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      initialized,
      signIn,
      signUp,
      signInWithGoogle,
      setAuthDataFromOTP,
      signOut,
    }),
    [user, token, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
