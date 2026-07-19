import { useState, useCallback, useEffect, useMemo } from 'react';
import { DeviceEventEmitter, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tasksApi } from '../services/task';
import type { TaskFilterId, ExtendedTaskItem } from '../types/tasks';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Bộ nhớ đệm Cache hệ thống toàn cục
let cachedTasks: ExtendedTaskItem[] | null = null;
let cachedTodos: ExtendedTaskItem[] | null = null;
let lastFetchTime = 0;
let activeFetchPromise: Promise<void> | null = null;
const CACHE_TTL_MS = 30 * 1000; 

export function useTasksList() {
  const [allTasks, setAllTasks] = useState<ExtendedTaskItem[]>(cachedTasks || []);
  const [allTodos, setAllTodos] = useState<ExtendedTaskItem[]>(cachedTodos || []);
  const [loading, setLoading] = useState<boolean>(!cachedTasks);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<TaskFilterId>('all');
  const [selectedItem, setSelectedItem] = useState<ExtendedTaskItem | null>(null);

  const fetchData = useCallback(async (force = false, silent = false, isRefresh = false) => {
    const now = Date.now();
    const isExpired = now - lastFetchTime > CACHE_TTL_MS;

    if (!force && cachedTasks && cachedTodos && !isExpired) {
      setAllTasks(cachedTasks);
      setAllTodos(cachedTodos);
      setLoading(false);
      return;
    }

    if (activeFetchPromise) {
      if (isRefresh) setRefreshing(true);
      else if (!silent) setLoading(!cachedTasks);

      await activeFetchPromise;

      if (cachedTasks && cachedTodos) {
        setAllTasks(cachedTasks);
        setAllTodos(cachedTodos);
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
        // GIẢI PHÁP CHỐT: Luôn luôn kéo 'all' từ Server về để Front-End có toàn bộ data gốc tính tiến độ
        const [tasksData, todosData] = await Promise.all([
          tasksApi.getTasks('all'),
          tasksApi.getTodos('all')
        ]);

        const rawTasks = Array.isArray(tasksData) ? tasksData : ((tasksData as any)?.data || []);
        const rawTodos = Array.isArray(todosData) ? todosData : ((todosData as any)?.data || []);

        const timeNow = new Date();

        const mappedTasks: ExtendedTaskItem[] = rawTasks.map((t: any) => {
          const rawPriority = t.Priority ?? t.priority ?? t.item?.Priority ?? t.item?.priority;
          const isHigh = rawPriority === 'high' || rawPriority === 3 || rawPriority === 4;

          const taskDueDate = t.dueDate || t.DueDate ? new Date(t.dueDate || t.DueDate) : null;
          const isOverdueRealtime = (!t.completed && t.status !== 'done') && taskDueDate !== null && taskDueDate < timeNow;

          let timeMeta = `Tạo: ${new Date(t.createdAt || t.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}`;
          if (taskDueDate) {
            timeMeta += ` • Hạn: ${taskDueDate.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
          }

          return {
            id: t.id || t.Id,
            title: t.title || t.Title,
            meta: timeMeta,
            description: t.description || t.Description || '',
            priority: isHigh ? 'high' : 'normal', 
            completed: t.status === 'done' || t.completed || false, 
            itemType: 'task',
            createdAt: t.createdAt || t.CreatedAt,
            dueDate: t.dueDate || t.DueDate,
            completedAt: t.completedAt || t.CompletedAt,
            isOverdue: isOverdueRealtime 
          } as any; 
        });

        const mappedTodos: ExtendedTaskItem[] = rawTodos.map((t: any) => {
          const todoDueDate = t.dueDate || t.DueDate ? new Date(t.dueDate || t.DueDate) : null;
          const isOverdueRealtime = (!t.completed && t.status !== 'done') && todoDueDate !== null && todoDueDate < timeNow;

          let timeMeta = `Tạo: ${new Date(t.createdAt || t.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}`;
          if (todoDueDate) {
            timeMeta += ` • Hạn: ${todoDueDate.toLocaleDateString('vi-VN')}`;
          }

          return {
            id: t.id || t.Id,
            title: t.title || t.Title,
            meta: timeMeta,
            description: t.description || t.Description || '',
            priority: t.priority === 'high' ? 'high' : 'normal',
            completed: t.completed || t.Completed || t.status === 'done' || false,
            itemType: 'todo',
            createdAt: t.createdAt || t.CreatedAt,
            dueDate: t.dueDate || t.DueDate,
            completedAt: t.completedAt || t.CompletedAt,
            isOverdue: isOverdueRealtime 
          } as any;
        });

        cachedTasks = mappedTasks;
        cachedTodos = mappedTodos;
        lastFetchTime = Date.now();
      } catch (error: any) {
        console.error('Lỗi kết nối API trong useTasksList:', error.message);
      }
    })();

    await activeFetchPromise;
    activeFetchPromise = null;

    if (cachedTasks && cachedTodos) {
      setAllTasks(cachedTasks);
      setAllTodos(cachedTodos);
    }

    setLoading(false);
    setRefreshing(false);
  }, []); 

  useFocusEffect(
    useCallback(() => {
      fetchData(true, true);
    }, [fetchData])
  );

  useEffect(() => {
    // Không cần force reload liên tục khi đổi tab nữa vì data local đã ôm trọn bộ
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeFilter]);

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

  // LUỒNG FILTER THÔNG MINH BẰNG MEMO DÀNH CHO HIỂN THỊ TRÊN CÁC TAB CHIP
  const timeNow = new Date();
  const startOfToday = new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), 0, 0, 0);
  const endOfToday = new Date(timeNow.getFullYear(), timeNow.getMonth(), timeNow.getDate(), 23, 59, 59);

  const isTodayItem = (item: any) => {
    if (!item.dueDate) return false;
    const itemDate = new Date(item.dueDate);
    return itemDate >= startOfToday && itemDate <= endOfToday;
  };

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'today') return allTasks.filter(isTodayItem);
    if (activeFilter === 'priority') return allTasks.filter(t => t.priority === 'high');
    if (activeFilter === 'overdue') return allTasks.filter(t => (t as any).isOverdue);
    return allTasks;
  }, [allTasks, activeFilter]);

  const filteredTodos = useMemo(() => {
    if (activeFilter === 'today') return allTodos.filter(isTodayItem);
    if (activeFilter === 'priority') return allTodos.filter(t => t.priority === 'high');
    if (activeFilter === 'overdue') return allTodos.filter(t => (t as any).isOverdue);
    return allTodos;
  }, [allTodos, activeFilter]);

  const handleToggleTask = useCallback((id: string, currentCompleted: boolean, itemType: 'task' | 'todo') => {
    const newCompleted = !currentCompleted;
    const completedAt = newCompleted ? new Date().toISOString() : undefined;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (itemType === 'task') {
      setAllTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted, completedAt } : t));
      if (cachedTasks) cachedTasks = cachedTasks.map(t => t.id === id ? { ...t, completed: newCompleted, completedAt } : t);
    } else {
      setAllTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted, completedAt } : t));
      if (cachedTodos) cachedTodos = cachedTodos.map(t => t.id === id ? { ...t, completed: newCompleted, completedAt } : t);
    }

    tasksApi[itemType === 'task' ? 'toggleTaskComplete' : 'toggleTodoComplete'](id)
      .then(() => {
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(prev => prev ? { ...prev, completed: newCompleted, completedAt } : null);
        }
        fetchData(true, true);
      })
      .catch((error) => {
        console.error('Lỗi cập nhật trạng thái:', error);
        if (itemType === 'task') {
          if (cachedTasks) cachedTasks = cachedTasks.map(t => t.id === id ? { ...t, completed: currentCompleted, completedAt: undefined } : t);
        } else {
          if (cachedTodos) cachedTodos = cachedTodos.map(t => t.id === id ? { ...t, completed: currentCompleted, completedAt: undefined } : t);
        }
        fetchData(true, true);
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
                setAllTasks(prev => prev.filter(t => t.id !== item.id));
                if (cachedTasks) cachedTasks = cachedTasks.filter(t => t.id !== item.id);
                await tasksApi.deleteTask(item.id, false, item);
              } else {
                setAllTodos(prev => prev.filter(t => t.id !== item.id));
                if (cachedTodos) cachedTodos = cachedTodos.filter(t => t.id !== item.id);
                await tasksApi.deleteTodo(item.id, false, item);
              }
              await fetchData(true, true);
            } catch (err) {
              console.error('Lỗi khi xóa mục:', err);
              Alert.alert('Thất bại', 'Không thể xóa tác vụ này vào lúc này.');
            }
          }
        }
      ]
    );
  }, [fetchData]);

  const handleOptimisticCreate = useCallback((task: ExtendedTaskItem) => {
    if (task.itemType === 'task') {
      setAllTasks(prev => [task, ...prev]);
      if (cachedTasks) cachedTasks = [task, ...cachedTasks];
    } else {
      setAllTodos(prev => [task, ...prev]);
      if (cachedTodos) cachedTodos = [task, ...cachedTodos];
    }
  }, []);

  const handleOptimisticUpdate = useCallback((updatedData: ExtendedTaskItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (updatedData.itemType === 'task') {
      setAllTasks(prev => prev.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t));
      if (cachedTasks) cachedTasks = cachedTasks.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t);
    } else {
      setAllTodos(prev => prev.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t));
      if (cachedTodos) cachedTodos = cachedTodos.map(t => t.id === updatedData.id ? { ...t, ...updatedData } : t);
    }
    if (selectedItem && selectedItem.id === updatedData.id) {
      setSelectedItem(prev => prev ? { ...prev, ...updatedData } : null);
    }
  }, [selectedItem]);

  return {
    tasks: filteredTasks, // Trả ra mảng đã được lọc động theo tab cho danh sách render gọn gàng
    todos: filteredTodos,
    allTasks,             // Xuất thêm 2 mảng tổng nguyên vẹn này ra ngoài
    allTodos,
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