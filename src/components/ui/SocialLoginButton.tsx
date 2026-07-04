import { getTypography } from '../../constants/typography';
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import { GOOGLE_ICON_URI } from '../../constants/assets';

type SocialLoginButtonProps = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'login' | 'register';
};

export default function SocialLoginButton({
  label,
  onPress,
  style,
  variant = 'login',
}: SocialLoginButtonProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'register' && styles.buttonRegister,
        pressed && styles.pressed,
        pressed && variant === 'register' && styles.pressedRegister,
        style,
      ]}
    >
      <Image source={{ uri: GOOGLE_ICON_URI }} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
  },
  buttonRegister: {
    paddingVertical: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  pressed: {
    backgroundColor: COLORS.surfaceContainerLow,
    transform: [{ scale: 0.98 }],
  },
  pressedRegister: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
});
