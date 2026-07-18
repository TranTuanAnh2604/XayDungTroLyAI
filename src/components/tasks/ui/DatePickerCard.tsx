import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DatePickerCardProps {
  label: string;
  date?: Date | null;
  valueText?: string;
  onPress: () => void;
  disabled?: boolean;
  iconName?: any;
}

export default function DatePickerCard({ label, date, valueText, onPress, disabled, iconName = 'calendar-month-outline' }: DatePickerCardProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={s.cardLeft}>
          <View style={s.iconWrapper}>
            <MaterialCommunityIcons name={iconName} size={18} color={COLORS.primary} />
          </View>
          <Text style={s.dateText}>
            {valueText ? valueText : (date ? `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chọn ngày')}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSecondary || "#999"} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  card: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.outline || '#ECECEC',
    borderRadius: 16,
    backgroundColor: COLORS.surface || '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}1A`, // opacity 10%
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
});
