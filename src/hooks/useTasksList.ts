import { useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tasksApi } from '../services/task';
import { detectEventType } from '../utils/eventTypeDetection';
import type { TaskFilterId, ExtendedTaskItem } from '../types/tasks';

let cachedTasks: ExtendedTaskItem[] | null = null;
let cachedTodos: ExtendedTaskItem[] | null = null;
let lastFetchTime = 0;
let activeFetchPromise: Promise<void> | null = null;
const CACHE_TTL_MS = 60 * 1000;

export function useTasksList() {
  const [tasks, setTasks] = useState<ExtendedTaskItem[]>(cachedTasks || []);
  const [todos, setTodos] = useState<ExtendedTaskItem[]>(cachedTodos || []);
  const [loading, setLoading] = useState<boolean>(!cachedTasks);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<TaskFilterId>('all');
  const [selectedItem, setSelectedItem] = useState<ExtendedTaskItem | null>(null);

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

  const handleOptimisticCreate = useCallback((task: ExtendedTaskItem) => {
    if (task.itemType === 'task') {
      setTasks(prev => [task, ...prev]);
      if (cachedTasks) cachedTasks = [task, ...cachedTasks];
    } else {
      setTodos(prev => [task, ...prev]);
      if (cachedTodos) cachedTodos = [task, ...cachedTodos];
    }
  }, []);

  const handleOptimisticUpdate = useCallback((updatedData: ExtendedTaskItem) => {
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
  }, [selectedItem]);

  return {
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
  };
}
