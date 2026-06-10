import { apiPost } from './api';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type RawAuthResponse = {
  token?: string | Record<string, unknown>;
  accessToken?: string | Record<string, unknown>;
  refreshToken?: string | Record<string, unknown>;
  user?: AuthUser | Record<string, unknown>;
  userId?: string;
  name?: string;
  email?: string;
  data?: {
    token?: string | Record<string, unknown>;
    accessToken?: string | Record<string, unknown>;
    user?: AuthUser | Record<string, unknown>;
    userId?: string;
    name?: string;
    email?: string;
  };
};

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse {
  const tokenValue =
    response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
  const userValue = response.user ?? response.data?.user;

  const parsedUser = {
    id:
      typeof (userValue as Record<string, unknown>)?.id === 'string'
        ? (userValue as Record<string, unknown>).id as string
        : response.userId ?? response.data?.userId ?? '',
    name:
      typeof (userValue as Record<string, unknown>)?.name === 'string'
        ? (userValue as Record<string, unknown>).name as string
        : response.name ?? response.data?.name ?? '',
    email:
      typeof (userValue as Record<string, unknown>)?.email === 'string'
        ? (userValue as Record<string, unknown>).email as string
        : response.email ?? response.data?.email,
  };

  if (tokenValue == null) {
    throw new Error('Không nhận được token từ server.');
  }

  if (!parsedUser.name && !parsedUser.id && !parsedUser.email) {
    throw new Error('Không nhận được thông tin người dùng từ server.');
  }

  const token = typeof tokenValue === 'string' ? tokenValue : JSON.stringify(tokenValue);

  return { token, user: parsedUser };
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
