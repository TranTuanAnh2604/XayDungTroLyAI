import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface ModalFooterProps {
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel: string;
  onSecondaryPress: () => void;
  isSubmitting?: boolean;
  isPrimaryDisabled?: boolean;
  secondaryType?: 'cancel' | 'danger';
}

export default function ModalFooter({
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  isSubmitting = false,
  isPrimaryDisabled = false,
  secondaryType = 'cancel',
}: ModalFooterProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={s.container}>
      <TouchableOpacity
        style={[s.secondaryBtn, secondaryType === 'danger' && s.dangerBtn]}
        onPress={onSecondaryPress}
        disabled={isSubmitting}
        activeOpacity={0.7}
      >
        <Text style={[s.secondaryText, secondaryType === 'danger' && s.dangerText]}>
          {secondaryLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.primaryBtn, isPrimaryDisabled && s.primaryBtnDisabled]}
        onPress={onPrimaryPress}
        disabled={isPrimaryDisabled || isSubmitting}
        activeOpacity={0.7}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={s.primaryText}>{primaryLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: COLORS.disabled || COLORS.outlineVariant || '#E0E0E0',
  },
  primaryText: {
    color: COLORS.onPrimary || '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtn: {
    borderColor: COLORS.error || '#FF3B30',
    backgroundColor: 'transparent',
  },
  secondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerText: {
    color: COLORS.error || '#FF3B30',
  },
});
