import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import AppLogo from '../ui/AppLogo';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type MessageLabelProps = {
  text: string;
  icon?: MaterialIconName;
  showLogo?: boolean;
  align?: 'left' | 'right';
};

export default function MessageLabel({
  text,
  icon,
  showLogo = false,
  align = 'left',
}: MessageLabelProps) {
  return (
    <View
      style={[
        styles.row,
        align === 'right' && styles.rowRight,
      ]}
    >
      {showLogo && align === 'left' ? <AppLogo size={18} /> : null}
      {!showLogo && icon && align === 'left' ? (
        <MaterialIcons name={icon} size={18} color={COLORS.primary} />
      ) : null}
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  text: {
    ...typography.labelCaps,
  },
});
