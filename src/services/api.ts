import {
  getAuthToken,
  getRefreshToken,
  updateAuthToken,
  clearAuthData,
} from './authStorage';

export const API_BASE_URL = 'https://assistantai-bc7b.onrender.com';

export type ApiResponse<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

let isRefreshingToken = false;
let refreshTokenPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshingToken && refreshTokenPromise) {
    return refreshTokenPromise;
  }

  isRefreshingToken = true;
  refreshTokenPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // Import here to avoid circular dependency
      const { refreshToken: refreshTokenFn } = await import('./auth');
      const response = await refreshTokenFn(refreshToken);
      
      await updateAuthToken(response.token, response.refreshToken);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    } finally {
      isRefreshingToken = false;
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

async function makeRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  skipAuth = false,
): Promise<T> {
  const token = await getAuthToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = `${API_BASE_URL}${normalizedPath}`;

  const REQUEST_TIMEOUT_MS = 300000;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log('REQUEST:', { requestUrl, method, skipAuth, hasAuthHeader: !!headers.Authorization });

  let response;
  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isAbortError =
      error instanceof Error
        ? error.name === 'AbortError'
        : error?.name === 'AbortError';

    if (isAbortError) {
      console.error('FETCH ERROR: Request aborted by timeout');
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again or check your network connection.`,
      );
    }

    console.error('FETCH ERROR:', error);
    throw error;
  }

  clearTimeout(timeoutId);

  const rawResponseBody =
    await response.json().catch(() => ({}));

  const responseBody =
    rawResponseBody &&
    typeof rawResponseBody === 'object' &&
    'body' in rawResponseBody &&
    rawResponseBody.body &&
    typeof rawResponseBody.body === 'object'
      ? rawResponseBody.body
      : rawResponseBody;

  console.log('STATUS:', response.status);

  // Handle 401 Unauthorized - try to refresh token for any authenticated request.
  // POST requests may also require refresh when the current auth token is expired.
  if (response.status === 401 && !path.includes('/refresh_token') && !path.includes('/login')) {
    console.log('AUTH: Received 401, attempting token refresh for', requestUrl);
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      return makeRequest<T>(method, path, body);
    }

    // Refresh failed, clear auth data to force re-login
    await clearAuthData();
    throw new Error('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const errorMessage =
      responseBody?.message ||
      responseBody?.Messenger ||
      responseBody?.messenger ||
      responseBody?.error ||
      responseBody?.errorMessage ||
      responseBody?.Message ||
      (typeof responseBody?.Messenger === 'string' ? responseBody.Messenger : undefined) ||
      `Server error (${response.status})`;

    console.error('API ERROR RESPONSE:', {
      url: requestUrl,
      status: response.status,
      body: responseBody,
    });

    throw new Error(errorMessage);
  }

  return responseBody as T;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  console.log('URL:', `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  if (body !== undefined) {
    console.log('BODY:', JSON.stringify(body));
  }
  return makeRequest<T>('POST', path, body, options?.skipAuth ?? false);
}

export async function apiGet<T>(
  path: string,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return makeRequest<T>('GET', path, undefined, options?.skipAuth ?? false);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return makeRequest<T>('PUT', path, body, options?.skipAuth ?? false);
}

export async function apiDelete<T>(
  path: string,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return makeRequest<T>('DELETE', path, undefined, options?.skipAuth ?? false);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: { skipAuth?: boolean },
): Promise<T> {
  const token = await getAuthToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = `${API_BASE_URL}${normalizedPath}`;

  const headers: Record<string, string> = {};

  if (!options?.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do NOT set Content-Type to application/json or multipart/form-data manually,
  // fetch will automatically set the correct boundary for FormData.

  const response = await fetch(requestUrl, {
    method: 'POST', // standard method for uploads
    headers,
    body: formData,
  });

  if (response.status === 401 && !path.includes('/refresh_token')) {
    // Basic 401 retry logic
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiUpload<T>(path, formData, options);
    }
    await clearAuthData();
    throw new Error('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const rawResponseBody = await response.json().catch(() => ({}));
    throw new Error(rawResponseBody?.message || `Server error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return makeRequest<T>('PATCH', path, body, options?.skipAuth ?? false);
}

