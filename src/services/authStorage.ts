import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, AuthUser } from './auth';
import { getGoogleIdToken } from './googleAuth';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const AUTH_USER_KEY = 'AUTH_USER';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';
const GOOGLE_REFRESH_TOKEN_KEY = 'GOOGLE_REFRESH_TOKEN';
const GMAIL_CONNECT_SENT_PREFIX = 'GMAIL_CONNECT_SENT_USER_';

// REFRESH_TOKEN_KEY is the app auth refresh token returned by login.
// GOOGLE_REFRESH_TOKEN_KEY is the Google OAuth refresh token returned by backend Google login.

export async function getGmailConnectSent(userId: string): Promise<boolean> {
  const value = await SecureStore.getItemAsync(`${GMAIL_CONNECT_SENT_PREFIX}${userId}`);
  return value === 'true';
}

export async function saveGmailConnectSent(userId: string): Promise<void> {
  await SecureStore.setItemAsync(`${GMAIL_CONNECT_SENT_PREFIX}${userId}`, 'true');
}

export async function clearGmailConnectSent(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${GMAIL_CONNECT_SENT_PREFIX}${userId}`);
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function getGoogleRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GOOGLE_REFRESH_TOKEN_KEY);
}

export async function saveGoogleRefreshToken(refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearGoogleRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(GOOGLE_REFRESH_TOKEN_KEY);
}

export async function getSavedAuth(): Promise<{ token: string; user: AuthUser | null } | null> {
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

export async function saveAuthData(response: AuthResponse & { refreshToken?: string | Record<string, unknown> }): Promise<void> {
  const token = typeof response.token === 'string' ? response.token : JSON.stringify(response.token);
  const userString = JSON.stringify(response.user ?? {});

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, userString);

  if (response.refreshToken !== undefined) {
    const refreshTokenValue =
      typeof response.refreshToken === 'string'
        ? response.refreshToken
        : JSON.stringify(response.refreshToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshTokenValue);
  }
}

export async function updateAuthToken(newToken: string, newRefreshToken?: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newToken);
  if (newRefreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
  }
}

export async function clearAuthData(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(GOOGLE_REFRESH_TOKEN_KEY);
}
