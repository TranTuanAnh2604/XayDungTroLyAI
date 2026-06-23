import { getAuthToken, getRefreshToken, updateAuthToken } from './authStorage';

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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

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

  const responseBody =
    await response.json().catch(() => ({}));

  console.log('STATUS:', response.status);

  // Handle 401 Unauthorized - try to refresh token
  if (response.status === 401 && method !== 'POST' && !path.includes('/refresh_token') && !path.includes('/login')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      return makeRequest<T>(method, path, body);
    }
  }

  if (!response.ok) {
    throw new Error(
      responseBody?.message ||
      responseBody?.error ||
      'Server error',
    );
  }

  return responseBody as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  console.log('URL:', `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
  console.log('BODY:', JSON.stringify(body));
  return makeRequest<T>('POST', path, body);
}

export async function apiGet<T>(path: string): Promise<T> {
  return makeRequest<T>('GET', path);
}

export async function apiPut<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return makeRequest<T>('PUT', path, body);
}

