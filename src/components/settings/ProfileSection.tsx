import { getTypography } from '../../constants/typography';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import type { UserProfile } from '../../types/settings';

type ProfileSectionProps = {
  profile: UserProfile;
  onEditProfile?: () => void;
  onEditAvatar?: () => void;
  avatarLoading?: boolean;
};

export default function ProfileSection({
  profile,
  onEditProfile,
  onEditAvatar,
  avatarLoading,
}: ProfileSectionProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <View style={styles.section}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />

        {avatarLoading && (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        )}

        <Pressable
          onPress={onEditAvatar}
          disabled={avatarLoading}
          style={({ pressed }) => [
            styles.editBadge,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="edit" size={16} color={COLORS.onPrimary} />
        </Pressable>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{profile.badge}</Text>
      </View>
      <Pressable
        onPress={onEditProfile}
        style={({ pressed }) => [
          styles.editBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.editBtnText}>Chỉnh sửa hồ sơ</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  section: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primaryContainer,
    padding: 6,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  name: {
    ...typography.headlineMd,
    fontSize: 24,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.secondaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginBottom: 16,
  },
  badgeText: {
    ...typography.labelCaps,
    color: COLORS.onSecondaryFixedVariant,
    textTransform: 'none',
    letterSpacing: 0,
  },
  editBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
  },
  editBtnText: {
    ...typography.labelCaps,
    color: COLORS.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
