import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import AppGlassCard from '../ui/AppGlassCard';

interface DynamicPreferencesRendererProps {
  data: Record<string, any>;
}

const DICTIONARY: Record<string, string> = {
  syncinterval: 'Tần suất đồng bộ',
  autoarchive: 'Tự động lưu trữ',
  notifications: 'Thông báo',
  theme: 'Giao diện',
  signature: 'Chữ ký',
  defaultlabels: 'Nhãn mặc định',
  language: 'Ngôn ngữ',
  timezone: 'Múi giờ',
  dark: 'Tối',
  light: 'Sáng',
  system: 'Hệ thống',
  vi: 'Tiếng Việt',
  en: 'Tiếng Anh',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
  syncsettings: 'Cài đặt đồng bộ',
  displaysettings: 'Cài đặt hiển thị',
  notificationsettings: 'Cài đặt thông báo',
  generalsettings: 'Cài đặt chung',
  accountsettings: 'Cài đặt tài khoản',
  securitysettings: 'Cài đặt bảo mật',
  emailsettings: 'Cài đặt email',
  advancedsettings: 'Cài đặt nâng cao',
  smartfeatures: 'Tính năng thông minh',
  aisettings: 'Cài đặt AI',
  preferences: 'Tùy chọn',
  settings: 'Cài đặt',
  toppinnedsenders: 'Người gửi được ghim nhiều nhất',
  mostarchivedcategories: 'Danh mục được lưu trữ nhiều nhất',
  importancebycategory: 'Mức độ quan trọng theo danh mục',
  totalbehaviorstracked: 'Tổng số hành vi được theo dõi',
  'loading...': 'Đang tải...',
  nodata: 'Không có dữ liệu',
  'no data': 'Không có dữ liệu',
  error: 'Lỗi',
  retry: 'Thử lại',
  success: 'Thành công',
  failed: 'Thất bại',
  unknown: 'Không xác định',
};

function formatLabel(key: string): string {
  if (!key) return '';
  const lowerKey = String(key).toLowerCase();
  if (DICTIONARY[lowerKey]) {
    return DICTIONARY[lowerKey];
  }
  // Convert camelCase or snake_case to Title Case as fallback
  const result = String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default function DynamicPreferencesRenderer({ data }: DynamicPreferencesRendererProps) {
  const { colors } = useTheme();
  const typography = React.useMemo(() => getTypography(colors), [colors]);
  const styles = React.useMemo(() => createStyles(colors, typography), [colors, typography]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const renderPreference = (key: string, value: any): React.ReactNode => {
    // 1. Boolean -> Switch (readonly)
    if (typeof value === 'boolean') {
      return (
        <View key={key} style={styles.listItem}>
          <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{formatLabel(key)}</Text>
          <Switch value={value} disabled trackColor={{ true: colors.primary }} />
        </View>
      );
    }

    // 2. Number -> Text + Badge style
    if (typeof value === 'number') {
      return (
        <View key={key} style={styles.listItem}>
          <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{formatLabel(key)}</Text>
          <View style={[styles.numberBadge, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[typography.bodyLg, { color: colors.onPrimaryContainer }]}>{value}</Text>
          </View>
        </View>
      );
    }

    // 3. String -> Label
    if (typeof value === 'string') {
      return (
        <View key={key} style={styles.listItem}>
          <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{formatLabel(key)}</Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, flexShrink: 1, textAlign: 'right', marginLeft: 16 }]} numberOfLines={2}>
            {formatLabel(value)}
          </Text>
        </View>
      );
    }

    // 4. Array -> Chip List
    if (Array.isArray(value)) {
      return (
        <View key={key} style={styles.listSection}>
          <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
          <View style={styles.chipGroup}>
            {value.map((item, idx) => {
              let labelToRender = '';
              if (typeof item === 'object' && item !== null) {
                const name = item.name || item.label || item.title || item.sender || item.email || item.category || item.displayName;
                const count = item.count !== undefined ? ` (${item.count})` : '';
                labelToRender = name ? `${formatLabel(String(name))}${count}` : JSON.stringify(item);
              } else {
                labelToRender = formatLabel(String(item));
              }

              return (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.surfaceContainer }]}>
                  <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>{labelToRender}</Text>
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    // 5. Object -> Group Card
    if (typeof value === 'object' && value !== null) {
      return (
        <View key={key} style={styles.listSection}>
          <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
          <AppGlassCard>
            {Object.entries(value).map(([k, v], idx, arr) => (
              <View key={k} style={[styles.nestedItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                {renderPreference(k, v)}
              </View>
            ))}
          </AppGlassCard>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.headlineMd, { color: colors.onBackground, marginBottom: 16 }]}>Tùy chọn</Text>
      <AppGlassCard>
        {Object.entries(data).map(([key, value], idx, arr) => (
          <View key={key} style={[styles.rootItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
            {renderPreference(key, value)}
          </View>
        ))}
      </AppGlassCard>
    </View>
  );
}

function createStyles(colors: any, typography: any) {
  return StyleSheet.create({
    container: {
      paddingBottom: 24, // SPACING.xl
    },
    rootItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
      paddingVertical: 4,
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8, // SPACING.sm
    },
    listSection: {
      paddingVertical: 8, // SPACING.sm
    },
    nestedItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    numberBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
  });
}
