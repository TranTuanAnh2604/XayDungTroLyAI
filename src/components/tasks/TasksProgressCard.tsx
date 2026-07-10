import { getTypography } from '../../constants/typography';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HomeGlassCard from '../home/HomeGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { TasksProgress } from '../../types/tasks';

type TasksProgressCardProps = {
  progress: TasksProgress;
};

export default function TasksProgressCard({ progress }: TasksProgressCardProps) {
  const { colors: COLORS, isDark } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography, isDark), [COLORS, typography, isDark]);
  const percent = progress.total > 0 ? progress.completed / progress.total : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [percent, widthAnim]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <HomeGlassCard variant="ai" padding={20}>
      <View style={styles.sparkle}>
        <MaterialIcons name="auto-awesome" size={24} color={COLORS.secondary} />
      </View>
      <Text style={styles.title}>Tiến độ hôm nay</Text>
      <Text style={styles.subtitle}>{progress.subtitle}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barWidth }]} />
      </View>
    </HomeGlassCard>
  );
}

const createStyles = (COLORS: any, typography: any, isDark: boolean) => StyleSheet.create({
  sparkle: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  title: {
    ...typography.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#000' : COLORS.onSurface,
    paddingRight: 32,
  },
  subtitle: {
    ...typography.bodyMd,
    color: isDark ? '#000' : undefined,
    marginTop: 4,
    marginBottom: 12,
  },
  track: {
    height: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.surfaceContainerHighest,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
  },
});
