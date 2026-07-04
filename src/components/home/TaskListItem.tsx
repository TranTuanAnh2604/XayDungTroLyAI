import { getTypography } from '../../constants/typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';

import type { HomeDailyTask } from '../../types/home';

type TaskListItemProps = {
  task: HomeDailyTask;
  onToggle?: (id: string, completed: boolean) => void;
};

export default function TaskListItem({ task, onToggle }: TaskListItemProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const completed = task.completed ?? false;

  return (
    <Pressable
      onPress={() => onToggle?.(task.id, !completed)}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <AppGlassCard
        variant="surface"
        padding={16}
        style={completed ? styles.rowCompleted : undefined}
      >
        <View style={styles.row}>
          <View style={[styles.checkbox, completed && styles.checkboxDone]}>
            {completed && (
              <MaterialIcons name="check" size={14} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.content}>
            <Text
              style={[styles.title, completed && styles.titleCompleted]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Text style={styles.meta}>{task.meta}</Text>
          </View>
        </View>
      </AppGlassCard>
    </Pressable>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowCompleted: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.95,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    borderColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodyMd,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  meta: {
    ...typography.taskMeta,
    marginTop: 4,
  },
});
