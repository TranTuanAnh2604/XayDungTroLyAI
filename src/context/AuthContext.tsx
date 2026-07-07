import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, AuthUser } from '../services/auth';
import { login as loginApi, register as registerApi, loginWithGoogle as loginWithGoogleApi } from '../services/auth';
import { getSavedAuth, saveAuthData, clearAuthData, saveGoogleRefreshToken, getGmailConnectSent, saveGmailConnectSent, clearGmailConnectSent } from '../services/authStorage';
import { signOutGoogle } from '../services/googleAuth';
import { connectGmail } from '../services/gmail';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string, serverAuthCode?: string) => Promise<void>;
  setAuthDataFromOTP: (authData: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const signInWithGoogle = async (idToken: string, serverAuthCode?: string) => {
    const response = await loginWithGoogleApi(idToken, serverAuthCode);
    await saveAuthData(response);
    if (response.refreshToken) {
      await saveGoogleRefreshToken(response.refreshToken);
    }

    const userId = response.user?.id;
    if (serverAuthCode && userId) {
      const hasSentGmailConnect = await getGmailConnectSent(userId);
      if (!hasSentGmailConnect) {
        try {
          const connectResult = await connectGmail(serverAuthCode);
          if (connectResult.success) {
            await saveGmailConnectSent(userId);
            // connectGmail updates the user's Google token on the backend, which may change their SecurityStamp
            // and invalidate the JWT we just received. We must re-authenticate to get a fresh, valid JWT.
            const freshResponse = await loginWithGoogleApi(idToken);
            await saveAuthData(freshResponse);
            setToken(freshResponse.token);
            setUser(freshResponse.user);
            return;
          } else {
            console.warn('⚠️ AuthContext: Gmail connect failed on first login', connectResult.message);
          }
        } catch (connectError: any) {
          console.warn('⚠️ AuthContext: connectGmail API threw an error', connectError?.message);
        }
      }
    }

    setToken(response.token);
    setUser(response.user);
  };

  const setAuthDataFromOTP = async (authData: AuthResponse) => {
    await saveAuthData(authData);
    setToken(authData.token);
    setUser(authData.user);
  };

  const signOut = async () => {
    if (user?.id) {
      await clearGmailConnectSent(user.id);
    }
    await signOutGoogle();
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
