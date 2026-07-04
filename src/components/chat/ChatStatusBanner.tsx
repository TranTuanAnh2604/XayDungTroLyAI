import { getTypography } from '../../constants/typography';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';


type ChatStatusBannerProps = {
  label: string;
  greeting: string;
};

export default function ChatStatusBanner({
  label,
  greeting,
}: ChatStatusBannerProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.greeting}>{greeting}</Text>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: COLORS.secondaryTint,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.secondary,
  },
  greeting: {
    ...typography.headlineMd,
    fontSize: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});
