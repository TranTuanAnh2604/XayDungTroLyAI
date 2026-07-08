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
 * Mutex cho refresh token: đảm bảo chỉ có 1 request refresh chạy tại một thời điểm.
 * Các request khác sẽ chờ kết quả của request đầu tiên.
 */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;

async function doRefreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const currentRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const refreshRes = await fetch(`${API_BASE_URL}/api/Auth/refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken, RefreshToken: currentRefreshToken }),
    });

    const refreshData = await refreshRes.json().catch(() => null);

    // Nếu server trả về 401 cho chính refresh endpoint → token thực sự hết hạn
    if (refreshRes.status === 401) {
      console.warn('[interceptor] Refresh token bị server từ chối (401). Xóa phiên.');
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      return null;
    }

    const isSuccess = refreshRes.ok && refreshData && (refreshData.success !== false && refreshData.Succeeded !== false);
    if (!isSuccess) {
      // Server lỗi tạm thời (500, 503...) — KHÔNG xóa token để tránh mất phiên
      console.warn(`[interceptor] Refresh thất bại (HTTP ${refreshRes.status}) nhưng không xóa token.`);
      return null;
    }

    const newTokens = refreshData.data || refreshData.Data || refreshData;
    const newAccessToken = newTokens.token || newTokens.accessToken || newTokens.AccessToken;
    const newRefreshToken = newTokens.refreshToken || newTokens.RefreshToken;

    if (newAccessToken && newRefreshToken) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newAccessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
      console.log('[interceptor] Refresh token thành công, token mới đã lưu.');
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    console.warn('[interceptor] Refresh response thiếu token fields.');
    return null;
  } catch (error) {
    // Lỗi mạng — KHÔNG xóa token
    console.warn('[interceptor] Lỗi mạng khi refresh token:', error);
    return null;
  }
}

/**
 * Hàm "Lính gác" tự động gắn Token và xử lý làm mới nếu Token hết hạn (401).
 * Sử dụng mutex để tránh race condition khi nhiều request đồng thời gặp 401.
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
    // Bỏ qua Gmail endpoints — lỗi 401 từ Gmail là do Google token, không phải app token
    if (url.includes('/api/Gmail/')) {
      return response;
    }

    // Sử dụng mutex: nếu đang có refresh chạy, chờ kết quả thay vì chạy thêm
    if (!refreshPromise) {
      refreshPromise = doRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newTokens = await refreshPromise;

    if (newTokens) {
      // Refresh thành công → gọi lại request gốc với token mới
      headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
    // Nếu refresh thất bại, trả về response 401 gốc để caller xử lý
    // KHÔNG xóa token ở đây — chỉ doRefreshToken() mới có quyền xóa khi server xác nhận 401
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