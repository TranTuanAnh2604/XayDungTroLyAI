import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PrioritySelectorProps {
  label: string;
  selectedPriority: 'normal' | 'high' | 'low';
  onPriorityChange: (priority: 'normal' | 'high' | 'low') => void;
  disabled?: boolean;
}

export default function PrioritySelector({ label, selectedPriority, onPriorityChange, disabled }: PrioritySelectorProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);

  const priorities = [
    { label: 'Thường', value: 'normal', icon: 'flag-outline' },
    { label: 'Cao', value: 'high', icon: 'flag-outline' },
  ] as const;

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <View style={s.chipsRow}>
        {priorities.map((prio) => {
          const isActive = selectedPriority === prio.value;
          const activeColor = prio.value === 'high' ? (COLORS.error || '#ef4444') : COLORS.primary;
          return (
            <TouchableOpacity
              key={prio.value}
              style={[
                s.chip, 
                isActive && { backgroundColor: activeColor, borderColor: activeColor }
              ]}
              onPress={() => onPriorityChange(prio.value)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isActive ? 'flag' : prio.icon as any} 
                size={16} 
                color={isActive ? '#fff' : '#666'} 
              />
              <Text style={[s.chipText, isActive && s.chipTextActive]}>
                {prio.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
});
