import { getTypography } from '../../constants/typography';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AiMemorySection from '../../components/settings/AiMemorySection';
import ProfileSection from '../../components/settings/ProfileSection';
import { TopAppBar } from '../../components/navigation';
import { getTopAppBarHeight, SCROLL_CONTENT_GAP } from '../../constants/layout';
import SettingsListSection from '../../components/settings/SettingsListSection';
import {
  ACCOUNT_SECTION,
  AI_MEMORY_ITEMS,
  PREFERENCES_SECTION,
} from '../../data/settingsMock';
import { SETTINGS_ASSETS } from '../../constants/settingsAssets';
import { useTheme } from '../../hooks/useTheme';

import { SPACING } from '../../constants/spacing';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import type { RootStackParamList } from '../../navigation/types';

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

        <SettingsListSection section={ACCOUNT_SECTION} />

        <SettingsListSection section={PREFERENCES_SECTION} />

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