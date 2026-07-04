import { apiGet, apiPut, apiUpload } from '../services/api';

export interface ApiUserProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatarUrl: string | null;
}

export const getProfile = async () => {
  const res = await apiGet<any>('/api/users/me');
  const data = res?.data ?? res;
  
  let rawAvatar = data?.avatarUrl ?? data?.AvatarUrl ?? data?.profileImage ?? data?.ProfileImage ?? null;
  if (rawAvatar && typeof rawAvatar === 'object') {
    rawAvatar = rawAvatar.uri || rawAvatar.url || rawAvatar.avatarUrl || null;
  }
  
  return {
    id: data?.id ?? data?.Id ?? '',
    name: data?.name ?? data?.Name ?? '',
    email: data?.email ?? data?.Email ?? '',
    timezone: data?.timezone ?? data?.Timezone ?? 'Asia/Ho_Chi_Minh',
    avatarUrl: typeof rawAvatar === 'string' ? rawAvatar : null,
  } as ApiUserProfile;
};

// Cập nhật Profile (Đã bọc lại payload viết hoa chữ cái đầu cho an toàn với C#)
export const updateProfile = (payload: { name: string; timezone: string }) => {
  return apiPut<string>('/api/users/me', {
    Name: payload.name,
    Timezone: payload.timezone
  });
};

// Upload Avatar (Giữ nguyên vì FormData truyền file tên field là 'file' chuẩn rồi)
export const uploadAvatar = async (
  uri: string,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const formData = new FormData();
  
  // Ép kiểu as any là thủ thuật chuẩn của React Native để nhét object vào FormData
  formData.append('file', { 
    uri: uri, 
    name: fileName, 
    type: mimeType 
  } as any);
  
  const res = await apiUpload<any>('/api/users/me/avatar', formData);
  const data = res?.data ?? res;
  
  let rawAvatar = data?.avatarUrl ?? data?.AvatarUrl ?? data ?? null;
  if (rawAvatar && typeof rawAvatar === 'object') {
    rawAvatar = rawAvatar.uri || rawAvatar.url || rawAvatar.avatarUrl || null;
  }
  
  return typeof rawAvatar === 'string' ? rawAvatar : '';
};