import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type DividerWithLabelProps = {
  label?: string;
  variant?: 'badge' | 'lines';
};

export default function DividerWithLabel({
  label = 'Hoặc',
  variant = 'badge',
}: DividerWithLabelProps) {
  const { colors: COLORS, isDark } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);

  // === ĐĂNG NHẬP (Dạng Badge) ===
  // Ép chữ HOẶC thành màu đen đậm khi ở Dark Mode để nổi bật, Light Mode dùng xám đậm
  const badgeTextColor = isDark ? '#000000' : COLORS.textSecondary;
  // Màu nền đục (Opaque) để che hoàn toàn đường kẻ chạy phía sau
  const badgeBgColor = isDark ? '#E2E8F0' : COLORS.surfaceContainer;

  // === ĐĂNG KÝ (Dạng Lines) ===
  // Làm nổi bật chữ "Hoặc" bên đăng ký bằng cách dùng màu textSecondary (sáng rõ ở cả 2 mode)
  const linesTextColor = COLORS.textSecondary;
  // Cho 2 viền kẻ hai bên đậm lên một xíu để nhìn rõ ràng, không bị quá mờ
  const linesRuleColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)';

  if (variant === 'lines') {
    return (
      <View style={styles.linesContainer}>
        <View style={[styles.linesRule, { backgroundColor: linesRuleColor }]} />
        <Text style={[styles.linesText, { color: linesTextColor }]}>{label}</Text>
        <View style={[styles.linesRule, { backgroundColor: linesRuleColor }]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Đường kẻ ngang chạy suốt từ trái qua phải (Đăng nhập) */}
      <View style={styles.line} />
      
      {/* Badge đè lên trên đường kẻ */}
      <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
        <Text style={[styles.text, { color: badgeTextColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    marginVertical: 32,
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
    top: '50%',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  text: {
    ...typography.labelCaps,
    fontWeight: '700',
  },
  linesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  linesRule: {
    flex: 1,
    height: 1.2, // Tăng nhẹ độ dày từ hairlineWidth lên 1.2 giúp đường viền sắc nét hơn
  },
  linesText: {
    ...typography.labelCaps,
    marginHorizontal: 16,
    fontWeight: '700', // Đổi từ 600 lên 700 để chữ "Hoặc" bên Đăng ký dày và nổi bật hơn
  },
});