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

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  token: string;
  refreshToken?: string;
};

type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
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
    refreshToken?: string | Record<string, unknown>;
    user?: AuthUser | Record<string, unknown>;
    userId?: string;
    name?: string;
    email?: string;
  };
};

function normalizeAuthResponse(response: RawAuthResponse): AuthResponse & { refreshToken?: string } {
  console.log('🔍 normalizeAuthResponse: Parsing response', JSON.stringify(response, null, 2));
  
  const tokenValue =
    response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken;
  const refreshTokenValue =
    response.refreshToken ?? response.data?.refreshToken;
  const userValue = response.user ?? response.data?.user;

  console.log('🔍 normalizeAuthResponse: tokenValue =', tokenValue);
  console.log('🔍 normalizeAuthResponse: refreshTokenValue =', refreshTokenValue);
  console.log('🔍 normalizeAuthResponse: userValue =', JSON.stringify(userValue, null, 2));

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

  console.log('🔍 normalizeAuthResponse: parsedUser =', JSON.stringify(parsedUser, null, 2));

  if (tokenValue == null) {
    console.error('❌ normalizeAuthResponse: Không tìm thấy token');
    throw new Error('Không nhận được token từ server.');
  }

  if (!parsedUser.name && !parsedUser.id && !parsedUser.email) {
    console.error('❌ normalizeAuthResponse: Không tìm thấy user info');
    throw new Error('Không nhận được thông tin người dùng từ server.');
  }

  const token = typeof tokenValue === 'string' ? tokenValue : JSON.stringify(tokenValue);
  console.log('🔍 normalizeAuthResponse: Final token =', token);

  return {
    token,
    user: parsedUser,
    refreshToken: typeof refreshTokenValue === 'string' ? refreshTokenValue : undefined,
  };
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
): Promise<{ success: boolean }> {
  console.log('📝 register: Gọi API', { name, email, password });
  const response = await apiPost<{ 
    success?: boolean; 
    message?: string 
  }>
    ('/api/Auth/register', {
      name,
      email,
      password,
    });
  console.log('📝 register: Response từ server', JSON.stringify(response, null, 2));
  return { success: response.success ?? true };
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const response = await apiPost<RawAuthResponse>('/api/Auth/google-login', {
    idToken,
  });
  return normalizeAuthResponse(response);
}

export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ success: boolean }> {
  const response = await apiPost<{ 
    success?: boolean; 
    message?: string 
  }>(
    '/api/Auth/verify-email',
    { email, otp }
  );

  return { success: response.success ?? true };
}

export async function resendOTP(email: string): Promise<{ success: boolean }> {
  const response = await apiPost<{
     success: boolean
  }>('/api/Auth/resend-otp', {
    email,
  });
  return response;
}

export async function forgotPassword(email: string) {
  const response = await apiPost<{
    success?: boolean;
    message?: string;
  }>('/api/Auth/forgot-password', { email });

  console.log('📝 forgotPassword response:', response);

    return {
      success: response.success ?? false,
      message: response.message,
    };
}

export async function resetPassword({
  email,
  otp,
  newPassword,
}:ResetPasswordRequest) {
  
  const response = await apiPost<{
    success?: boolean;
    message?: string;
  }>('/api/Auth/reset-password', {
    email,
    otp,
    newPassword,
  });

  console.log('📝 resetPassword: Response từ server', JSON.stringify(response, null, 2));
  return {
    success: response.success ?? true,
    message: response.message,
  };
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<RefreshTokenResponse> {
  const response = await apiPost<{
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  }>(
    '/api/Auth/refresh_token',
    {
      refreshToken: refreshTokenValue,
    },
  );

  const token =
    response.token ?? response.accessToken;

  if (!token) {
    throw new Error('Không nhận được token mới từ server');
  }

  return {
    token,
    refreshToken: response.refreshToken,
  };
}