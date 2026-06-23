import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, AuthUser } from './auth';

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const AUTH_USER_KEY = 'AUTH_USER';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
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

export async function saveAuthData(response: AuthResponse & { refreshToken?: string }): Promise<void> {
  const token = typeof response.token === 'string' ? response.token : JSON.stringify(response.token);
  const userString = JSON.stringify(response.user ?? {});

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, userString);

  if (response.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
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
}
