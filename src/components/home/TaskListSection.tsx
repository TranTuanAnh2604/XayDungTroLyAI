import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TaskListItem from './TaskListItem';
import { useTheme } from '../../hooks/useTheme';
import type { HomeDailyTask } from '../../types/home';

type TaskListSectionProps = {
  tasks: HomeDailyTask[];
  onToggleTask?: (id: string, completed: boolean) => void;
};

export default function TaskListSection({
  tasks,
  onToggleTask,
}: TaskListSectionProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Nhiệm vụ trong ngày</Text>
      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  section: {},
  title: {
    ...typography.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
});
