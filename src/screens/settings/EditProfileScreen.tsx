import { getTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TopAppBar } from '../../components/navigation';
import AppGlassCard from '../../components/ui/AppGlassCard';
import { getTopAppBarHeight, SCROLL_CONTENT_GAP } from '../../constants/layout';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import { SPACING } from '../../constants/spacing';
import { useProfile, updateLocalProfile } from '../../hooks/useProfile';
import { updateProfile } from '../../services/user';
import type { RootStackParamList } from '../../navigation/types';

const TIMEZONE_OPTIONS = [
  { label: 'Hồ Chí Minh (UTC+7)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Bangkok (UTC+7)', value: 'Asia/Bangkok' },
  { label: 'Singapore (UTC+8)', value: 'Asia/Singapore' },
  { label: 'Tokyo (UTC+9)', value: 'Asia/Tokyo' },
];

export default function EditProfileScreen() {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, loading } = useProfile();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [saving, setSaving] = useState(false);

  const headerHeight = getTopAppBarHeight(insets);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setTimezone(profile.timezone);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), timezone });
      updateLocalProfile({ name: name.trim(), timezone });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Lỗi', 'Cập nhật thất bại, thử lại sau');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.root}>
        <TopAppBar
          title="Chỉnh sửa hồ sơ"
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <ActivityIndicator style={{ marginTop: headerHeight + 24 }} color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopAppBar
        title="Chỉnh sửa hồ sơ"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <View
        style={[
          styles.content,
          { paddingTop: headerHeight + SCROLL_CONTENT_GAP },
        ]}
      >
        <Text style={styles.label}>Tên hiển thị</Text>
        <AppGlassCard variant="surface" padding={0}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên của bạn"
            placeholderTextColor={COLORS.onSurfaceVariant}
            style={styles.input}
          />
        </AppGlassCard>

        <Text style={[styles.label, { marginTop: 24 }]}>Múi giờ</Text>
        <AppGlassCard variant="surface" padding={0}>
          {TIMEZONE_OPTIONS.map((opt, index) => (
            <View key={opt.value}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                onPress={() => setTimezone(opt.value)}
                style={({ pressed }) => [
                  styles.tzRow,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.tzLabel}>{opt.label}</Text>
                {timezone === opt.value && (
                  <MaterialIcons name="check" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            </View>
          ))}
        </AppGlassCard>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.savePressed,
            saving && styles.saveDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.onPrimary} />
          ) : (
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.containerMobile,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  input: {
    ...typography.bodyLg,
    color: COLORS.onSurface,
    padding: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
  },
  tzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowPressed: { backgroundColor: COLORS.surfaceContainerLow },
  tzLabel: { ...typography.bodyLg, color: COLORS.onSurface },
  saveBtn: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  savePressed: { opacity: 0.9 },
  saveDisabled: { opacity: 0.6 },
  saveText: { ...typography.bodyLg, fontWeight: '600', color: COLORS.onPrimary },
});