import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProjectCard from '../../components/tasks/ProjectCard';
import TaskFilterChips from '../../components/tasks/TaskFilterChips';
import TaskListItem from '../../components/tasks/TaskListItem';
import TasksFAB from '../../components/tasks/TasksFAB';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import TasksProgressCard from '../../components/tasks/TasksProgressCard';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import {
  PROJECT_CARDS,
  TASK_FILTERS,
  TASK_ITEMS,
  TASKS_PROGRESS,
} from '../../data/tasksMock';
import { typography } from '../../constants/typography';
import type { TaskFilterId, TaskItem } from '../../types/tasks';
import { useOpenSettings } from '../../hooks/useOpenSettings';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [tasks, setTasks] = useState<TaskItem[]>(TASK_ITEMS);
  const [activeFilter, setActiveFilter] = useState<TaskFilterId>('all');
  const bottomChrome = getBottomNavReservedHeight(insets);

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return tasks.filter((t) => !t.completed || t.id === 't3');
      case 'priority':
        return tasks.filter((t) => t.priority === 'high');
      case 'project':
        return tasks.filter((t) => t.title.includes('UI') || t.title.includes('Redesign'));
      default:
        return tasks;
    }
  }, [activeFilter, tasks]);

  const handleToggleTask = useCallback((id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );
  }, []);

  const progress = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    return {
      ...TASKS_PROGRESS,
      completed,
      total: tasks.length,
      subtitle: `${completed}/${tasks.length} Hoàn thành • Năng suất tốt`,
    };
  }, [tasks]);

  return (
    <TabScreenLayout
      topBar={
        <TopAppBar onSettingsPress={openSettings} />
      }
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      footer={<TasksFAB bottomOffset={bottomChrome + 16} />}
    >
      <TasksProgressCard progress={progress} />

      <TaskFilterChips
        filters={TASK_FILTERS}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      <Text style={styles.sectionLabel}>Công việc hiện tại</Text>
      {filteredTasks.map((task, index) => (
        <TaskListItem
          key={task.id}
          task={task}
          index={index}
          onToggle={handleToggleTask}
        />
      ))}

      <View style={styles.projectsBlock}>
        <Text style={styles.sectionLabel}>Dự án liên quan</Text>
        <View style={styles.projectGrid}>
          {PROJECT_CARDS.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </View>
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.labelCaps,
    letterSpacing: 2,
    marginBottom: 4,
  },
  projectsBlock: {
    gap: 4,
  },
  projectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});
