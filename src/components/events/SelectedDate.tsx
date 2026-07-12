import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';

interface SelectedDateProps {
  selectedDateId: string;
}

const MONTH_NAMES = [
  'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
  'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
];

export default function SelectedDate({ selectedDateId }: SelectedDateProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const date = useMemo(() => {
    const d = new Date(selectedDateId);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDateId]);

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>
        {date.getDate()} {MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
      </Text>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  dateText: {
    ...typography.bodyLg,
    color: COLORS.textSecondary,
    fontWeight: '500',
  }
});
