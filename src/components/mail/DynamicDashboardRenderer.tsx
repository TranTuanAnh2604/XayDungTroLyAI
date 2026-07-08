import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import AppGlassCard from '../ui/AppGlassCard';
import { RADIUS } from '../../constants/theme';

interface DynamicDashboardRendererProps {
  data: Record<string, any>;
}

const DICTIONARY: Record<string, string> = {
  dashboard: 'Bảng điều khiển',
  maildashboard: 'Bảng điều khiển Email',
  'mail dashboard': 'Bảng điều khiển Email',
  totalemails: 'Tổng số email',
  'total emails': 'Tổng số email',
  unreadcount: 'Email chưa đọc',
  'unread count': 'Email chưa đọc',
  pendingaianalysis: 'Email chờ AI phân tích',
  'pending ai analysis': 'Email chờ AI phân tích',
  importancebreakdown: 'Phân loại theo mức độ quan trọng',
  'importance breakdown': 'Phân loại theo mức độ quan trọng',
  categorybreakdown: 'Phân loại theo danh mục',
  'category breakdown': 'Phân loại theo danh mục',
  preferences: 'Tùy chọn',
  settings: 'Cài đặt',
  refresh: 'Làm mới',
  'loading dashboard...': 'Đang tải bảng điều khiển...',
  nodata: 'Không có dữ liệu',
  'no data': 'Không có dữ liệu',
  retry: 'Thử lại',
  failed: 'Thất bại',
  unknown: 'Không xác định',
  category: 'Danh mục',
  count: 'Số lượng',
  'failed to load dashboard': 'Không thể tải bảng điều khiển.',
  'dashboard loaded successfully': 'Đã tải bảng điều khiển thành công.',
  'no dashboard data available': 'Không có dữ liệu bảng điều khiển.',
  'something went wrong': 'Đã xảy ra lỗi.',
  'please try again later': 'Vui lòng thử lại sau.',
  summary: 'Thống kê tổng quan',
  stats: 'Số liệu chi tiết',
  total: 'Tổng số',
  unread: 'Chưa đọc',
  read: 'Đã đọc',
  spam: 'Thư rác',
  important: 'Quan trọng',
  draft: 'Thư nháp',
  sent: 'Đã gửi',
  recommendation: 'Gợi ý từ AI',
  tips: 'Mẹo sử dụng',
  suggestion: 'Đề xuất',
  aisummary: 'Tóm tắt thông minh',
  percentage: 'Tỉ lệ',
  progress: 'Tiến độ',
  rate: 'Tỉ lệ',
  score: 'Điểm số',
  chart: 'Biểu đồ',
  trend: 'Xu hướng',
  history: 'Lịch sử',
  weekly: 'Tuần này',
  daily: 'Hôm nay',
  monthly: 'Tháng này',
  status: 'Trạng thái',
  priority: 'Mức độ ưu tiên',
  importance: 'Độ quan trọng',
  emails: 'Danh sách Email',
  messages: 'Tin nhắn',
  success: 'Thành công',
  done: 'Hoàn thành',
  pending: 'Đang xử lý',
  warning: 'Cảnh báo',
  error: 'Lỗi',
  fail: 'Thất bại',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
  normal: 'Bình thường',
  work: 'Công việc',
  personal: 'Cá nhân',
  social: 'Mạng xã hội',
  promotion: 'Khuyến mãi',
  updates: 'Cập nhật',
  forum: 'Diễn đàn',
};

function formatLabel(key: string, context?: string): string {
  if (key === undefined || key === null) return '';
  const strKey = String(key);
  const lowerKey = strKey.toLowerCase();

  // Map numeric importance levels if context suggests it
  if (context && (context.toLowerCase().includes('importance') || context.toLowerCase().includes('quan trọng'))) {
    const importanceMap: Record<string, string> = {
      '1': 'Khẩn cấp',
      '2': 'Quan trọng',
      '3': 'Thông tin',
      '4': 'Bình thường',
      '5': 'Thấp'
    };
    if (importanceMap[strKey]) {
      return importanceMap[strKey];
    }
  }

  if (DICTIONARY[lowerKey]) {
    return DICTIONARY[lowerKey];
  }
  // Convert camelCase or snake_case to Title Case as fallback
  const result = strKey.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default function DynamicDashboardRenderer({ data }: DynamicDashboardRendererProps) {
  const { colors } = useTheme();
  const typography = React.useMemo(() => getTypography(colors), [colors]);
  const styles = React.useMemo(() => createStyles(colors, typography), [colors, typography]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const renderValue = (key: string, value: any): React.ReactNode => {
    const lowerKey = key.toLowerCase();

    // 1. AI Insight Card
    if (['recommendation', 'tips', 'suggestion', 'aisummary'].some(k => lowerKey.includes(k))) {
      return (
        <AppGlassCard key={key} style={[styles.aiCard, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.headerRow}>
            <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
            <Text style={[typography.headlineSm, { color: colors.primary, marginLeft: 8 }]}>
              {formatLabel(key)}
            </Text>
          </View>
          <Text style={[typography.bodyMd, { color: colors.onSurface, marginTop: 8 }]}>
            {String(value)}
          </Text>
        </AppGlassCard>
      );
    }

    // 2. Arrays (Lists/Charts)
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      const firstItem = value[0];

      // Time-based (chart/trend fallback)
      if (['chart', 'trend', 'history', 'weekly', 'daily', 'monthly'].some(k => lowerKey.includes(k))) {
        return (
          <View key={key} style={styles.section}>
            <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
            {value.map((item, idx) => {
              const itemLabel = item.date || item.time || item.label || item.name || item.title || item.key || item.category || item.importance || item.classification;
              const displayLabel = itemLabel && itemLabel !== 'Unknown' && itemLabel !== 'null' ? formatLabel(String(itemLabel), key) : 'Không có nhãn';
              return (
                <View key={idx} style={styles.listItem}>
                  <Text style={typography.bodyMd}>{displayLabel}</Text>
                  <Text style={[typography.bodyLg, { color: colors.primary }]}>{item.value || item.count || JSON.stringify(item)}</Text>
                </View>
              );
            })}
          </View>
        );
      }

      // Stats list (label/count)
      if (firstItem && typeof firstItem === 'object' && ('label' in firstItem || 'count' in firstItem)) {
         return (
          <View key={key} style={styles.section}>
            <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
            {value.map((item, idx) => {
              const itemLabel = item.label || item.name || item.title || item.key || item.category || item.importance || item.classification;
              const displayLabel = itemLabel && itemLabel !== 'Unknown' && itemLabel !== 'null' ? formatLabel(String(itemLabel), key) : 'Không có nhãn';
              return (
                <View key={idx} style={styles.listItem}>
                  <Text style={typography.bodyMd}>{displayLabel}</Text>
                  <Text style={[typography.bodyLg, { color: colors.primary }]}>{item.count || 0}</Text>
                </View>
              );
            })}
          </View>
         );
      }

      // Info Card list (title/description)
      if (firstItem && typeof firstItem === 'object' && ('title' in firstItem || 'description' in firstItem)) {
        return (
          <View key={key} style={styles.section}>
            <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
            {value.map((item, idx) => (
              <AppGlassCard key={idx} style={{ marginBottom: 8 }}>
                <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{item.description}</Text>
              </AppGlassCard>
            ))}
          </View>
        );
      }

      // Email list (subject/from)
      if (firstItem && typeof firstItem === 'object' && ('subject' in firstItem || 'from' in firstItem || 'sender' in firstItem)) {
        return (
          <View key={key} style={styles.section}>
            <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
            {value.map((item, idx) => (
              <View key={idx} style={[styles.listItem, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={[typography.bodyLg, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.subject || 'Không có tiêu đề'}
                </Text>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {item.from || item.sender || 'Người gửi không xác định'} • {item.date || 'Không có ngày'}
                </Text>
              </View>
            ))}
          </View>
        );
      }
      
      // Generic array
      return (
        <View key={key} style={styles.section}>
           <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
             {value.map((item, idx) => (
               <View key={idx} style={[styles.chip, { backgroundColor: colors.surfaceContainer }]}>
                 <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant }]}>{formatLabel(String(item))}</Text>
               </View>
             ))}
           </View>
        </View>
      );
    }

    // 3. Summary / Stats Objects
    if (typeof value === 'object' && value !== null && ['summary', 'stats'].some(k => lowerKey.includes(k))) {
       const keys = Object.keys(value);
       return (
         <View key={key} style={styles.section}>
           <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 12 }]}>{formatLabel(key)}</Text>
           <View style={styles.summaryGrid}>
             {keys.map(k => (
               <View key={k} style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                  <Text style={[typography.statLg, { color: colors.primary }]}>{value[k]}</Text>
                  <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]} numberOfLines={1}>{formatLabel(k)}</Text>
               </View>
             ))}
           </View>
         </View>
       );
    }

    // 4. Progress / Percentage
    if (typeof value === 'number' && ['percentage', 'progress', 'rate', 'score'].some(k => lowerKey.includes(k))) {
       const percent = Math.min(Math.max(value, 0), 100);
       return (
         <View key={key} style={styles.section}>
           <View style={styles.headerRow}>
             <Text style={[typography.bodyLg, { color: colors.onBackground }]}>{formatLabel(key)}</Text>
             <Text style={[typography.bodyLg, { color: colors.primary }]}>{percent}%</Text>
           </View>
           <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer, marginTop: 8 }]}>
             <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${percent}%` }]} />
           </View>
         </View>
       );
    }

    // 5. Status Badge
    if (lowerKey.includes('status')) {
       let badgeColor = colors.primary;
       const strVal = String(value).toLowerCase();
       if (strVal.includes('success') || strVal.includes('done')) badgeColor = '#4CAF50';
       if (strVal.includes('warning') || strVal.includes('pending')) badgeColor = '#FFC107';
       if (strVal.includes('error') || strVal.includes('fail')) badgeColor = '#F44336';

       return (
         <View key={key} style={[styles.section, styles.headerRow, { justifyContent: 'flex-start' }]}>
           <Text style={[typography.bodyMd, { color: colors.onBackground, marginRight: 8 }]}>{formatLabel(key)}:</Text>
           <View style={[styles.badge, { backgroundColor: badgeColor }]}>
             <Text style={[typography.labelCaps, { color: '#FFF' }]}>{formatLabel(String(value))}</Text>
           </View>
         </View>
       );
    }

    // 6. Priority / Importance Chip
    if (lowerKey.includes('priority') || lowerKey.includes('importance')) {
      return (
         <View key={key} style={[styles.section, styles.headerRow, { justifyContent: 'flex-start' }]}>
           <Text style={[typography.bodyMd, { color: colors.onBackground, marginRight: 8 }]}>{formatLabel(key)}:</Text>
           <View style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}>
             <Text style={[typography.labelCaps, { color: colors.onPrimaryContainer }]}>{formatLabel(String(value))}</Text>
           </View>
         </View>
      );
    }

    // Fallback: Generic Object
    if (typeof value === 'object' && value !== null) {
      return (
        <View key={key} style={styles.section}>
          <Text style={[typography.headlineSm, { color: colors.onBackground, marginBottom: 8 }]}>{formatLabel(key)}</Text>
          <AppGlassCard>
            {Object.entries(value).map(([k, v]) => (
              <View key={k} style={[styles.listItem, { borderBottomWidth: 0 }]}>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>{formatLabel(k)}</Text>
                <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{typeof v === 'string' ? formatLabel(v) : String(v)}</Text>
              </View>
            ))}
          </AppGlassCard>
        </View>
      );
    }

    // Fallback: Generic Primitive
    return (
      <View key={key} style={[styles.section, styles.headerRow, { justifyContent: 'space-between' }]}>
        <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginRight: 8 }]}>{formatLabel(key)}:</Text>
        <Text style={[typography.bodyLg, { color: colors.onSurface }]}>{typeof value === 'string' ? formatLabel(value) : String(value)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Object.entries(data).map(([key, value]) => renderValue(key, value))}
    </View>
  );
}

function createStyles(colors: any, typography: any) {
  return StyleSheet.create({
    container: {
      paddingBottom: 24, // previously SPACING.xl
    },
    section: {
      marginBottom: 16, // previously SPACING.lg
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    aiCard: {
      marginBottom: 16, // previously SPACING.lg
      padding: 12, // previously SPACING.md
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8, // previously SPACING.sm
    },
    summaryCard: {
      flex: 1,
      minWidth: '30%',
      padding: 12, // previously SPACING.md
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8, // previously SPACING.sm
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    progressBarBg: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
  });
}
