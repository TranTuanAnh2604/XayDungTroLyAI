import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TaskListItem from './TaskListItem';
import { typography } from '../../constants/typography';
import type { TaskItem } from '../../types/home';

type TaskListSectionProps = {
  tasks: TaskItem[];
  onToggleTask?: (id: string, completed: boolean) => void;
};

export default function TaskListSection({
  tasks,
  onToggleTask,
}: TaskListSectionProps) {
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

const styles = StyleSheet.create({
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
