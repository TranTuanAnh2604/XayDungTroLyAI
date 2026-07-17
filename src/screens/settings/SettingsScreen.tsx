import { getTypography } from '../../constants/typography';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProfileSection from '../../components/settings/ProfileSection';
import { TopAppBar } from '../../components/navigation';
import { getTopAppBarHeight, SCROLL_CONTENT_GAP } from '../../constants/layout';
import SettingsListSection from '../../components/settings/SettingsListSection';
import {
  ACCOUNT_SECTION,
  PREFERENCES_SECTION,
} from '../../data/settingsMock';
import { SETTINGS_ASSETS } from '../../constants/settingsAssets';
import { useTheme } from '../../hooks/useTheme';

import { SPACING } from '../../constants/spacing';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import type { RootStackParamList } from '../../navigation/types';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';
import OTPVerificationModal from '../../components/auth/OTPVerificationModal';
import ResetPasswordModal from '../../components/auth/ResetPasswordModal';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal';
import { forgotPassword, resetPassword } from '../../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { profile, loading, uploading, pickAndUploadAvatar } = useProfile();

  const displayName = profile?.name || user?.name || user?.email || 'Người dùng';
  const displayAvatar = profile?.avatarUrl || SETTINGS_ASSETS.avatar;

  const headerHeight = getTopAppBarHeight(insets);

  const handleLogout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@app:push_enabled');
        if (saved !== null) {
          setPushEnabled(saved === 'true');
        } else {
          // Check system permissions if nothing saved
          const { status } = await Notifications.getPermissionsAsync();
          setPushEnabled(status === 'granted');
        }
      } catch (e) {
        console.warn('Failed to load push setting', e);
      }
    })();
  }, []);

  const dynamicPreferencesSection = {
    ...PREFERENCES_SECTION,
    items: PREFERENCES_SECTION.items.map((item) => {
      if (item.id === 'push') {
        return { ...item, toggleDefault: pushEnabled };
      }
      return item;
    }),
  };

  const handleToggleChange = async (itemId: string, value: boolean) => {
    if (itemId === 'push') {
      if (value) {
        // User wants to turn it on
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const granted = await Notifications.requestPermissionsAsync();
          if (granted.status !== 'granted') {
            Alert.alert(
              'Cấp quyền thông báo',
              'Vui lòng cấp quyền thông báo cho ứng dụng trong Cài đặt của thiết bị để bật tính năng này.',
            );
            setPushEnabled(false);
            return;
          }
        }
      }
      // Save preference
      setPushEnabled(value);
      try {
        await AsyncStorage.setItem('@app:push_enabled', String(value));
      } catch (e) {
        console.warn('Failed to save push setting', e);
      }
    }
  };

  const [activeModal, setActiveModal] = useState<{
    type: 'none' | 'forgot' | 'otp' | 'reset' | 'changePassword';
    email?: string;
    otp?: string;
  }>({ type: 'none' });

  const handleAccountAction = (itemId: string) => {
    if (itemId === 'password') {
      setActiveModal({ type: 'changePassword' });
    }
  };

  const handleForgotPasswordSubmit = async (emailInput: string) => {
    try {
      await forgotPassword(emailInput);
      setActiveModal({ type: 'otp', email: emailInput });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi OTP');
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!activeModal.email) return;
    // For password reset, we don't call verify-email API.
    // We just proceed to the reset step and send the OTP along with the new password.
    setActiveModal({ type: 'reset', email: activeModal.email, otp });
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!activeModal.email || !activeModal.otp) return;
    try {
      await resetPassword({
        email: activeModal.email,
        otp: activeModal.otp,
        newPassword,
      });
      Alert.alert('Thành công', 'Mật khẩu đã được cập nhật');
      setActiveModal({ type: 'none' });
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đổi mật khẩu');
    }
  };

  const closePasswordResetFlow = () => {
    setActiveModal({ type: 'none' });
  };

  return (
    <View style={styles.root}>
      <TopAppBar
        title="Cài đặt"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + SCROLL_CONTENT_GAP,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading && !profile ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
        ) : (
          <ProfileSection
            profile={{
              name: displayName,
              badge: 'Professional',
              avatarUri: displayAvatar,
            }}
            onEditAvatar={pickAndUploadAvatar}
            avatarLoading={uploading}
            onEditProfile={() => navigation.navigate('EditProfile')}
          />
        )}

        {/* <AiMemorySection items={AI_MEMORY_ITEMS} /> */}

        <SettingsListSection section={ACCOUNT_SECTION} onItemPress={handleAccountAction} />

        <SettingsListSection section={dynamicPreferencesSection} onToggleChange={handleToggleChange} />

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutPressed,
          ]}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>

      <ForgotPasswordModal
        visible={activeModal.type === 'forgot'}
        onClose={closePasswordResetFlow}
        onSubmit={handleForgotPasswordSubmit}
      />

      <OTPVerificationModal
        visible={activeModal.type === 'otp'}
        email={activeModal.email || ''}
        onClose={closePasswordResetFlow}
        onVerify={handleVerifyOtp}
      />

      <ResetPasswordModal
        visible={activeModal.type === 'reset'}
        email={activeModal.email || ''}
        onClose={closePasswordResetFlow}
        onSubmit={handleResetPassword}
      />

      <ChangePasswordModal
        visible={activeModal.type === 'changePassword'}
        onClose={closePasswordResetFlow}
        onSuccess={closePasswordResetFlow}
      />
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.containerMobile,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  logoutBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.errorContainerTint,
    alignItems: 'center',
  },
  logoutText: { ...typography.bodyLg, fontWeight: '600', color: COLORS.error },
  logoutPressed: { backgroundColor: `${COLORS.errorContainer}66` },
});