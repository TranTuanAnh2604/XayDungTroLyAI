import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { getTypography } from '../../../constants/typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onClose?: () => void;
}

export default function ModalHeader({ title, subtitle, rightElement, onClose }: ModalHeaderProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const s = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  return (
    <View style={s.container}>
      <View style={s.textContainer}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      <View style={s.rightContainer}>
        {rightElement}
        {onClose && (
          <TouchableOpacity 
            style={s.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary || '#666'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, 
    minHeight: 44, 
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26, 
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 2, 
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary || COLORS.outline,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 32, 
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
