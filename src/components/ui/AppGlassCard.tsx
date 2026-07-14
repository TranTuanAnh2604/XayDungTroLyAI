import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SHADOW } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type AppGlassCardVariant = 'ai' | 'elevated' | 'surface';

type AppGlassCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: AppGlassCardVariant;
  /** @deprecated Use `variant="ai"` */
  glow?: boolean;
  /** @deprecated Use `variant="ai"` */
  tint?: boolean;
  padding?: number;
}>;

export default function AppGlassCard({
  children,
  style,
  variant,
  glow = false,
  tint = false,
  padding = 20,
}: AppGlassCardProps) {
  const { colors: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const resolved: AppGlassCardVariant =
    variant ?? (glow || tint ? 'ai' : 'surface');
  const isAi = resolved === 'ai';
  const isElevated = resolved === 'elevated';

  return (
    <View
      style={[
        styles.wrapper,
        isAi && styles.wrapperAi,
        isElevated && styles.wrapperElevated,
        resolved === 'surface' && styles.wrapperSurface,
        isAi && SHADOW.aiGlow,
        isElevated && SHADOW.card,
        style,
      ]}
    >
      {isAi ? (
        <LinearGradient
          colors={[
            'transparent',
            'rgba(129, 39, 207, 0.06)',
            'rgba(129, 39, 207, 0.22)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      <BlurView
        intensity={isAi ? 55 : 40}
        tint={isDark ? 'dark' : 'light'}
        style={[
          StyleSheet.absoluteFill,
          isAi ? styles.blurAi : styles.blurDefault,
        ]}
      />

      {isAi ? <View style={styles.lavenderWash} pointerEvents="none" /> : null}

      <View style={[styles.inner, { padding }]}>{children}</View>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.premium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  wrapperAi: {
    borderRadius: RADIUS.aiCard,
    borderColor: COLORS.aiCardBorder,
    backgroundColor: COLORS.aiCardSurface,
  },
  wrapperElevated: {
    borderRadius: RADIUS.aiCard,
    borderColor: COLORS.primaryContainerBorder,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  wrapperSurface: {
    borderRadius: RADIUS.aiCard,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  blurDefault: {
    backgroundColor: COLORS.glassBackground,
  },
  blurAi: {
    backgroundColor: 'rgba(245, 243, 255, 0.72)',
  },
  lavenderWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 243, 255, 0.45)',
  },
  inner: {
    zIndex: 1,
  },
});
