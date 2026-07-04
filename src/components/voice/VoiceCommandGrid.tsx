import { getTypography } from '../../constants/typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { VoiceCommand } from '../../types/voice';

type VoiceCommandGridProps = {
  commands: VoiceCommand[];
  onPress?: (command: VoiceCommand) => void;
};

export default function VoiceCommandGrid({
  commands,
  onPress,
}: VoiceCommandGridProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <View style={styles.grid}>
      {commands.map((command) => (
        <Pressable
          key={command.id}
          onPress={() => onPress?.(command)}
          style={({ pressed }) => [
            styles.cell,
            pressed && styles.cardPressed,
          ]}
        >
          <AppGlassCard variant="surface" padding={16} style={styles.card}>
          <MaterialIcons
            name={command.icon}
            size={24}
            color={
              command.iconColor === 'primary'
                ? COLORS.primary
                : COLORS.secondary
            }
            style={styles.icon}
          />
          <Text style={styles.title}>{command.title}</Text>
          <Text style={styles.subtitle}>{command.subtitle}</Text>
          </AppGlassCard>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
  },
  card: {
    flex: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.92,
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.outline,
    marginTop: 4,
  },
});
