import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getTypography } from '../../constants/typography';
import type { TimelineEvent } from '../../types/events';

interface EventCardProps {
  event: TimelineEvent;
  onEdit?: () => void;
}

export default function EventCard({ event, onEdit }: EventCardProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const config = useMemo(() => {
    switch (event.type) {
      case 'urgent':
        return {
          bgColor: `${COLORS.danger}1A`,
          iconColor: COLORS.danger,
          iconName: 'priority-high' as const,
        };
      case 'meeting':
        return {
          bgColor: `${COLORS.warning}1A`,
          iconColor: COLORS.warning,
          iconName: 'group' as const,
        };
      case 'break':
        return {
          bgColor: COLORS.surfaceContainerHigh,
          iconColor: COLORS.textSecondary,
          iconName: 'free-breakfast' as const,
        };
      case 'task':
      default:
        return {
          bgColor: `${COLORS.primary}1A`,
          iconColor: COLORS.primary,
          iconName: 'event' as const,
        };
    }
  }, [event.type, COLORS]);

  return (
    <Pressable 
      onPress={onEdit}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: config.bgColor },
        pressed && styles.pressed
      ]}
    >
      <View style={styles.leftContent}>
        <MaterialIcons name={config.iconName} size={20} color={config.iconColor} />
        <Text style={[styles.title, { color: config.iconColor }]} numberOfLines={1}>
          {event.title}
        </Text>
      </View>
      <Text style={[styles.time, { color: config.iconColor }]}>
        {event.time}
      </Text>
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  title: {
    ...typography.bodyMd,
    fontWeight: '500',
    marginLeft: 12,
    flexShrink: 1,
  },
  time: {
    ...typography.bodySm,
    fontWeight: '500',
  }
});
