import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://assistantai-bc7b.onrender.com';
//export const API_BASE_URL = 'http://192.168.1.12:5283';

type ApiEnvelope<T> = {
  success?: boolean;
  Succeeded?: boolean;
  messenger?: string;
  message?: string;
  Message?: string;
  title?: string;
  errors?: Record<string, string[]>;
  data?: T;
  Data?: T;
};

const AUTH_TOKEN_KEY = 'AUTH_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';

/**
 * Hàm "Lính gác" tự động gắn Token và xử lý làm mới nếu Token hết hạn (401)
 */
async function fetchWithInterceptor(url: string, options: RequestInit): Promise<Response> {
  // 1. Gắn Token hiện tại vào Header
  let token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  let headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Chạy API lần đầu
  let response = await fetch(url, { ...options, headers });

  // 3. Nếu BE trả về 401 Unauthorized (Hết hạn Token)
  if (response.status === 401) {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    // Nếu có Refresh Token thì thử gọi API làm mới
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/Auth/refresh_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshToken, RefreshToken: refreshToken }),
        });

        const refreshData = await refreshRes.json().catch(() => null);
        const isSuccess = refreshRes.ok && refreshData && (refreshData.success !== false && refreshData.Succeeded !== false);

        if (isSuccess) {
          // Bóc tách Token mới từ phản hồi của C#
          const newTokens = refreshData.data || refreshData.Data || refreshData;
          const newAccessToken = newTokens.token || newTokens.accessToken || newTokens.AccessToken;
          const newRefreshToken = newTokens.refreshToken || newTokens.RefreshToken;

          if (newAccessToken && newRefreshToken) {
            // Lưu token mới vào máy
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newAccessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

            // Gắn token mới và thử gọi lại API ban đầu lần 2 một cách âm thầm
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(url, { ...options, headers });
          }
        } else if (response.status === 401 && !url.includes('/api/Gmail/')) {
          // Nếu Refresh Token cũng hết hạn -> Xóa token để ép về màn hình Login (Chỉ áp dụng nếu lỗi ban đầu là 401)
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        }
      } catch (error) {
        console.log('Lỗi trong quá trình Refresh Token', error);
      }
    } else if (response.status === 401 && !url.includes('/api/Gmail/')) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }

  return response;
}

/**
 * Xử lý bóc tách các mảng lỗi, validation trả về từ BE
 */
function handleApiResponse<T>(response: Response, result: ApiEnvelope<T> | null): T {
  const isSuccess = response.ok && (result?.success !== false && result?.Succeeded !== false);

  if (!isSuccess) {
    let errorMsg = result?.message || result?.Message || result?.messenger;

    if (!errorMsg && result?.errors) {
      const errorList = Object.values(result.errors).flat();
      if (errorList.length > 0) {
        errorMsg = errorList.join('\n');
      }
    }
    if (!errorMsg && result?.title) {
      errorMsg = result.title;
    }

    throw new Error(errorMsg || `Phiên đăng nhập không hợp lệ hoặc máy chủ lỗi (HTTP ${response.status}).`);
  }

  return (result?.data !== undefined ? result.data : result?.Data) as T ?? (result as unknown as T);
}

// ─────────────────────────────────────────────────────────────
// CÁC PHƯƠNG THỨC API GỌI QUA INTERCEPTOR
// ─────────────────────────────────────────────────────────────
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    // Gọi fetchWithInterceptor thay vì fetch thuần
    const response = await fetchWithInterceptor(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const response = await fetchWithInterceptor(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const response = await fetchWithInterceptor(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const response = await fetchWithInterceptor(url, {
      method: 'POST',
      body: formData,
      // Không set Content-Type để form-data tự sinh boundary
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}
export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const response = await fetchWithInterceptor(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}
export async function apiDelete<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const response = await fetchWithInterceptor(url, {
      method: 'DELETE', // Định nghĩa đúng HTTP Method DELETE cho đồng bộ với C#
      headers: { 'Content-Type': 'application/json' },
    });
    const result = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
    return handleApiResponse(response, result);
  } catch (error: any) {
    if (error.name === 'ApiError') throw error;
    throw new Error(error.message || 'Không thể kết nối tới máy chủ.');
  }
}