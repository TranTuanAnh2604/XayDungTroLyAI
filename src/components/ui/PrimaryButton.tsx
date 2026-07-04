import { getTypography } from '../../constants/typography';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RADIUS, SHADOW } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';


type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  showArrow?: boolean;
  glow?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({
  label,
  onPress,
  loading,
  showArrow = true,
  glow = false,
  style,
}: PrimaryButtonProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        glow && SHADOW.aiGlow,
        pressed && styles.pressed,
        loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.onPrimary} />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          {showArrow && (
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color={COLORS.onPrimary}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    ...SHADOW.button,
  },
  label: {
    ...typography.bodyLg,
    fontWeight: '700',
    color: COLORS.onPrimary,
    flex: 1,
    minWidth: 0,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.7,
  },
});
