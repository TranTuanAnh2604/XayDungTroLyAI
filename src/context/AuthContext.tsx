import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, AuthUser } from '../services/auth';
import { login as loginApi, register as registerApi } from '../services/auth';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const AUTH_USER_KEY = 'AUTH_USER';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
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
    const response = await registerApi(fullName, email, password);
    await saveAuthData(response);
    setToken(response.token);
    setUser(response.user);
  };

  const signOut = async () => {
    await clearAuthData();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, initialized, signIn, signUp, signOut }),
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
