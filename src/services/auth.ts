import { apiPost } from './api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type RawAuthResponse = {
  token?: string | Record<string, unknown>;
  accessToken?: string | Record<string, unknown>;
  user?: AuthUser | Record<string, unknown>;
  data?: {
    token?: string | Record<string, unknown>;
    accessToken?: string | Record<string, unknown>;
    user?: AuthUser | Record<string, unknown>;
  };
};

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
  const tokenValue =
    response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
  const userValue = response.user ?? response.data?.user;

  if (tokenValue == null) {
    throw new Error('Không nhận được token từ server.');
  }

  if (userValue == null || typeof userValue !== 'object') {
    throw new Error('Không nhận được thông tin người dùng từ server.');
  }

  const token = typeof tokenValue === 'string' ? tokenValue : JSON.stringify(tokenValue);
  const user = userValue as AuthUser;

  return { token, user };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiPost<RawAuthResponse>('/api/Auth/login', {
    email,
    password,
  });
  return normalizeAuthResponse(response);
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await apiPost<RawAuthResponse>('/api/Auth/register', {
    name,
    email,
    password,
  });
  return normalizeAuthResponse(response);
}
