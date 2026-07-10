import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, uploadAvatar, ApiUserProfile } from '../services/user';

let globalProfile: ApiUserProfile | null = null;
const listeners = new Set<(profile: ApiUserProfile | null) => void>();

export function updateLocalProfile(updates: Partial<ApiUserProfile>) {
  if (globalProfile) {
    globalProfile = { ...globalProfile, ...updates };
    listeners.forEach((listener) => listener(globalProfile));
  }
}

export function clearLocalProfile() {
  globalProfile = null;
  fetchPromise = null;
  listeners.forEach((listener) => listener(null));
}

let isFetching = false;
let fetchPromise: Promise<ApiUserProfile> | null = null;

export function useProfile() {
  const [profile, setProfile] = useState<ApiUserProfile | null>(globalProfile);
  const [loading, setLoading] = useState(!globalProfile);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    listeners.add(setProfile);
    return () => {
      listeners.delete(setProfile);
    };
  }, []);

  const fetchProfile = useCallback(async (force = false) => {
    if (globalProfile && !force) {
      setLoading(false);
      return;
    }
    
    if (fetchPromise) {
      setLoading(true);
      await fetchPromise;
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      fetchPromise = getProfile();
      const data = await fetchPromise;
      globalProfile = data;
      listeners.forEach((listener) => listener(globalProfile));
    } finally {
      fetchPromise = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const pickAndUploadAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const avatarUrl = await uploadAvatar(
        asset.uri,
        asset.fileName ?? `avatar_${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg'
      );
      updateLocalProfile({ avatarUrl });
    } finally {
      setUploading(false);
    }
  }, []);

  return { profile, loading, uploading, pickAndUploadAvatar, refetch: fetchProfile };
}