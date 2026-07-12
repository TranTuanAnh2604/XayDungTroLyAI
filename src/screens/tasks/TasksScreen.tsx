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
  RefreshControl,
  DeviceEventEmitter
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
import { useTheme } from '../../hooks/useTheme';
import { detectEventType } from '../../utils/eventTypeDetection';

let cachedTasks: ExtendedTaskItem[] | null = null;
let cachedTodos: ExtendedTaskItem[] | null = null;
let lastFetchTime = 0;
let activeFetchPromise: Promise<void> | null = null;
const CACHE_TTL_MS = 60 * 1000;

export default function TasksScreen() {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const bottomChrome = getBottomNavReservedHeight(insets);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  const [tasks, setTasks] = useState<ExtendedTaskItem[]>(cachedTasks || []);
  const [todos, setTodos] = useState<ExtendedTaskItem[]>(cachedTodos || []);
  const [loading, setLoading] = useState<boolean>(!cachedTasks);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<TaskFilterId>('all');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtendedTaskItem | null>(null);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Chưa cập nhật';
    const d = new Date(isoString);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
  };

  const fetchData = useCallback(async (force = false, silent = false, isRefresh = false) => {
    const now = Date.now();
    const isExpired = now - lastFetchTime > CACHE_TTL_MS;

    if (!force && cachedTasks && cachedTodos && !isExpired) {
      setTasks(cachedTasks);
      setTodos(cachedTodos);
      setLoading(false);
      return;
    }

    if (activeFetchPromise) {
      if (isRefresh) setRefreshing(true);
      else if (!silent) setLoading(!cachedTasks);

      await activeFetchPromise;

      if (cachedTasks && cachedTodos) {
        setTasks(cachedTasks);
        setTodos(cachedTodos);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else if (!silent && (!cachedTasks || !cachedTodos)) {
      setLoading(true);
    }

    activeFetchPromise = (async () => {
      try {
        const [tasksData, todosData] = await Promise.all([
          tasksApi.getTasks(),
          tasksApi.getTodos('all')
        ]);

        const rawTasks = Array.isArray(tasksData) ? tasksData : ((tasksData as any)?.data || []);
        const rawTodos = Array.isArray(todosData) ? todosData : ((todosData as any)?.data || []);

        const mappedTasks: ExtendedTaskItem[] = rawTasks.map((t: any) => {
          const isHigh = t.priority === 'high' || t.priority === 3 || detectEventType(t.title || t.Title || '') === 'urgent';

          let timeMeta = `Tạo: ${new Date(t.createdAt || t.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}`;
          if (t.dueDate || t.DueDate) {
            timeMeta += ` • Hạn: ${new Date(t.dueDate || t.DueDate).toLocaleDateString('vi-VN')}`;
          }

          return {
            id: t.id || t.Id,
            title: t.title || t.Title,
            meta: timeMeta,
            description: t.description || t.Description || 'Không có mô tả',
            priority: isHigh ? 'high' : 'normal',
            completed: t.status === 'done',
            itemType: 'task',
            createdAt: t.createdAt || t.CreatedAt,
            dueDate: t.dueDate || t.DueDate,
            completedAt: t.completedAt || t.CompletedAt
          };
        });

        const mappedTodos: ExtendedTaskItem[] = rawTodos.map((t: any) => {
          let timeMeta = `Tạo: ${new Date(t.createdAt || t.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}`;
          if (t.dueDate || t.DueDate) {
            timeMeta += ` • Hạn: ${new Date(t.dueDate || t.DueDate).toLocaleDateString('vi-VN')}`;
          }

          return {
            id: t.id || t.Id,
            title: t.title || t.Title,
            meta: timeMeta,
            description: t.description || t.Description || 'Không có mô tả',
            priority: 'normal',
            completed: t.completed || t.Completed || false,
            itemType: 'todo',
            createdAt: t.createdAt || t.CreatedAt,
            dueDate: t.dueDate || t.DueDate,
            completedAt: t.completedAt || t.CompletedAt
          };
        });

        cachedTasks = mappedTasks;
        cachedTodos = mappedTodos;
        lastFetchTime = Date.now();
      } catch (error: any) {
        console.error('Lỗi kết nối API:', error.message);
      }
    })();

    await activeFetchPromise;
    activeFetchPromise = null;

    if (cachedTasks && cachedTodos) {
      setTasks(cachedTasks);
      setTodos(cachedTodos);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(false, true);
    }, [fetchData])
  );

  useEffect(() => {
    const taskSub = DeviceEventEmitter.addListener('tasks_changed', () => {
      fetchData(true, true);
    });
    const eventSub = DeviceEventEmitter.addListener('events_changed', () => {
      fetchData(true, true);
    });
    return () => {
      taskSub.remove();
      eventSub.remove();
    };
  }, [fetchData]);

  const handleToggleTask = useCallback((id: string, currentCompleted: boolean, itemType: 'task' | 'todo') => {
    if (itemType === 'task') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted, completedAt: !currentCompleted ? new Date().toISOString() : undefined } : t));
    } else {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted, completedAt: !currentCompleted ? new Date().toISOString() : undefined } : t));
    }

    tasksApi[itemType === 'task' ? 'toggleTaskComplete' : 'toggleTodoComplete'](id)
      .then(() => {
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(prev => prev ? { ...prev, completed: !currentCompleted, completedAt: !currentCompleted ? new Date().toISOString() : undefined } : null);
        }
        fetchData(false, true);
      })
      .catch((error) => {
        console.error('Lỗi cập nhật trạng thái:', error);
        fetchData(false, true);
      });
  }, [selectedItem, fetchData]);

  const handleDeleteItem = useCallback((item: ExtendedTaskItem) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa "${item.title}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa bỏ',
          style: 'destructive',
          onPress: async () => {
            try {
              setSelectedItem(null);
              if (item.itemType === 'task') {
                setTasks(prev => prev.filter(t => t.id !== item.id));
                if (cachedTasks) cachedTasks = cachedTasks.filter(t => t.id !== item.id);
                await tasksApi.deleteTask(item.id);
              } else {
                setTodos(prev => prev.filter(t => t.id !== item.id));
                if (cachedTodos) cachedTodos = cachedTodos.filter(t => t.id !== item.id);
                await tasksApi.deleteTodo(item.id);
              }
              await fetchData(false, true);
            } catch (err) {
              console.error('Lỗi khi xóa:', err);
              Alert.alert('Thất bại', 'Không thể xóa tác vụ này vào lúc này.');
            }
          }
        }
      ]
    );
  }, [fetchData]);

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
        onOptimisticCreate={(task) => {
          if (task.itemType === 'task') {
            setTasks(prev => [task, ...prev]);
            if (cachedTasks) cachedTasks = [task, ...cachedTasks];
          } else {
            setTodos(prev => [task, ...prev]);
            if (cachedTodos) cachedTodos = [task, ...cachedTodos];
          }
        }}
        onVoicePress={() => setIsVoiceModalVisible(true)}
      />

      <TaskDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaved={() => fetchData(false, true)}
        onOptimisticUpdate={(updatedData) => {
          if (updatedData.itemType === 'task') {
            setTasks(prev => prev.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t));
            if (cachedTasks) cachedTasks = cachedTasks.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t);
          } else {
            setTodos(prev => prev.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t));
            if (cachedTodos) cachedTodos = cachedTodos.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t);
          }
          if (selectedItem && selectedItem.id === updatedData.id) {
            setSelectedItem(prev => prev ? { ...prev, ...updatedData } : null);
          }
        }}
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
