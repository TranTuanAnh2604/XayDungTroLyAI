import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://assistantai-bc7b.onrender.com';

export type ApiResponse<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const token =
    await AsyncStorage.getItem('token');
    
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const requestUrl =
    `${API_BASE_URL}${normalizedPath}`;

  const REQUEST_TIMEOUT_MS = 300000;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  let response;
console.log('URL:', requestUrl);
console.log('BODY:', JSON.stringify(body));
  try {
    response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error:any) {
    clearTimeout(timeoutId);
    const isAbortError =
      error instanceof Error
        ? error.name === 'AbortError'
        : error?.name === 'AbortError';

    if (isAbortError) {
      console.error('FETCH ERROR: Request aborted by timeout');
      console.error('TIMEOUT_MS:', REQUEST_TIMEOUT_MS);
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again or check your network connection.`,
      );
    }

    console.error('FETCH ERROR:', error);
    console.error('NAME:', error?.name);
    console.error('MESSAGE:', error?.message);

    throw error;
  }

  clearTimeout(timeoutId);

  const responseBody =
    await response.json().catch(() => ({}));

  // console.log('TOKEN:', token);
  console.log('STATUS:', response.status);

  if (!response.ok) {
    throw new Error(
      responseBody?.message ||
      responseBody?.error ||
      'Server error',
    );
  }

  return responseBody as T;
}
