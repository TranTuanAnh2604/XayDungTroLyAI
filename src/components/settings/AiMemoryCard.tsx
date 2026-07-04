import { getTypography } from '../../constants/typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import type { AiMemoryItem } from '../../types/settings';

type AiMemoryCardProps = {
  item: AiMemoryItem;
  onPress?: () => void;
};

export default function AiMemoryCard({ item, onPress }: AiMemoryCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <AppGlassCard variant="ai" padding={16}>
        <MaterialIcons
          name="auto-awesome"
          size={20}
          color={`${COLORS.secondary}66`}
          style={styles.sparkle}
        />
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <MaterialIcons name={item.icon} size={22} color={COLORS.secondary} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>
      </AppGlassCard>
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  sparkle: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconBox: {
    padding: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: `${COLORS.secondaryContainer}33`,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  description: {
    ...typography.bodyMd,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
