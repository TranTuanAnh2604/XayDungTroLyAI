import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TaskFilterChips from '../../components/tasks/TaskFilterChips';
import TaskListItem from '../../components/tasks/TaskListItem';
import TasksFAB from '../../components/tasks/TasksFAB';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import TasksProgressCard from '../../components/tasks/TasksProgressCard';
import { getBottomNavReservedHeight, SCROLL_BOTTOM_EXTRA } from '../../constants/layout';
import { TASK_FILTERS } from '../../data/tasksMock';
import { getTypography } from '../../constants/typography';
import { RADIUS } from '../../constants/theme';
import type { TaskFilterId, TaskPriority, ExtendedTaskItem } from '../../types/tasks';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { tasksApi } from '../../services/task';
import DateTimePicker from '@react-native-community/datetimepicker';
import VoiceTaskModal from '../../components/tasks/VoiceTaskModal';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import { useTasksList } from '../../hooks/useTasksList';
import { useTheme } from '../../hooks/useTheme';
export default function TasksScreen() {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const bottomChrome = getBottomNavReservedHeight(insets);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  const {
    tasks,
    todos,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    selectedItem,
    setSelectedItem,
    fetchData,
    handleToggleTask,
    handleDeleteItem,
    handleOptimisticCreate,
    handleOptimisticUpdate
  } = useTasksList();

  const progressData = useMemo(() => {
    const totalItems = tasks.length + todos.length;
    const completedItems = tasks.filter(t => t.completed).length + todos.filter(t => t.completed).length;

    let productivityText = '';
    if (totalItems > 0) {
      const percentage = completedItems / totalItems;
      if (percentage === 1) productivityText = 'Hoàn thành xuất sắc';
      else if (percentage >= 0.7) productivityText = 'Năng suất tốt';
      else if (percentage >= 0.4) productivityText = 'Đang tiến triển';
      else if (percentage > 0) productivityText = 'Mới bắt đầu';
      else productivityText = 'Chưa bắt đầu';
    }

    return {
      completed: completedItems,
      total: totalItems,
      subtitle: totalItems > 0
        ? `${completedItems}/${totalItems} Hoàn thành • ${productivityText}`
        : 'Hôm nay chưa có công việc nào',
    };
  }, [tasks, todos]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'priority') return tasks.filter(t => t.priority === 'high');
    return tasks;
  }, [activeFilter, tasks]);

  const filteredTodos = useMemo(() => {
    if (activeFilter === 'priority') return [];
    return todos;
  }, [activeFilter, todos]);

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      footer={<TasksFAB bottomOffset={bottomChrome + 16} onPress={() => setIsModalVisible(true)} />}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true, false, true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )
      }}
    >
      <TasksProgressCard progress={progressData} />

      <View style={styles.listGroup}>
        <TaskFilterChips
          filters={TASK_FILTERS}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.container}>

          {filteredTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Công việc ưu tiên (Tasks)</Text>
              {filteredTasks.map((task, index) => (
                <TaskListItem
                  key={`task-${task.id}`}
                  task={task}
                  index={index}
                  onToggle={(id) => handleToggleTask(id, task.completed, 'task')}
                  onPress={() => setSelectedItem(task)}
                />
              ))}
            </View>
          )}

          {filteredTodos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Việc cần làm hôm nay (Todos)</Text>
              {filteredTodos.map((todo, index) => (
                <TaskListItem
                  key={`todo-${todo.id}`}
                  task={todo}
                  index={index}
                  onToggle={(id) => handleToggleTask(id, todo.completed, 'todo')}
                  onPress={() => setSelectedItem(todo)}
                />
              ))}
            </View>
          )}

          {filteredTasks.length === 0 && filteredTodos.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có công việc nào trong danh mục này.</Text>
            </View>
          )}
        </View>
      )}
      </View>

      <CreateTaskModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSaved={() => fetchData(false, true)}
        onOptimisticCreate={handleOptimisticCreate}
        onVoicePress={() => setIsVoiceModalVisible(true)}
      />

      <TaskDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaved={() => fetchData(false, true)}
        onOptimisticUpdate={handleOptimisticUpdate}
        onDelete={(item) => handleDeleteItem(item)}
        onToggleCompletion={(item) => handleToggleTask(item.id, item.completed, item.itemType)}
      />

      <VoiceTaskModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onSaved={fetchData}
      />
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: { gap: 16 },
  listGroup: { width: '100%', gap: 8 },
  section: { marginBottom: 8 },
  sectionLabel: { ...typography.labelCaps, letterSpacing: 1.5, marginBottom: 8, color: COLORS.textSecondary },
  emptyContainer: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { ...typography.bodyMd, color: COLORS.textSecondary, fontStyle: 'italic' },
});
