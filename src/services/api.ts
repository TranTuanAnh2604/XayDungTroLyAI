export const API_BASE_URL = 'https://assistantai-bc7b.onrender.com';

export type ApiResponse<T> = T;

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const requestUrl = `${API_BASE_URL}${normalizedPath}`;

  let response;
  try {
    response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
  console.log('FETCH ERROR:', error);
  throw new Error(
    'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.'
  );
}

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.message || responseBody?.error || 'Đã xảy ra lỗi máy chủ.';
    throw new Error(errorMessage);
  }

  return responseBody as ApiResponse<T>;
}
