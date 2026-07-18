import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import VoiceTaskModal from '../../components/tasks/VoiceTaskModal';
import { useTasksList } from '../../hooks/useTasksList';
import { useTheme } from '../../hooks/useTheme';
import { useOpenSettings } from '../../hooks/useOpenSettings';

export default function TasksScreen() {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const openSettings = useOpenSettings();
  const insets = useSafeAreaInsets();
  const bottomChrome = getBottomNavReservedHeight(insets);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);

  const {
    tasks, 
    todos,
    allTasks, // Mảng tổng nguyên vẹn gồm cả việc hôm nay, ngày mai, quá hạn...
    allTodos, // Mảng tổng nguyên vẹn việc cần làm
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

  // Mốc thời gian thực tế phục vụ tính toán
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const isTodayItem = (item: any) => {
    if (!item.dueDate) return false;
    const itemDate = new Date(item.dueDate);
    return itemDate >= startOfToday && itemDate <= endOfToday;
  };

  // === 📊 BẢNG TỔNG TIẾN ĐỘ TOÀN HỆ THỐNG CỐ ĐỊNH 100% ===
  const progressData = useMemo(() => {
    // Quét trên mảng tổng để gom hết toàn bộ công việc hiện có (Bao quát cả 4 tab)
    const totalItems = allTasks.length + allTodos.length;
    const completedItems = allTasks.filter(t => t.completed).length + allTodos.filter(t => t.completed).length;
    const pendingItems = totalItems - completedItems;

    // Tính toán số lượng công việc bị QUÁ HẠN tồn đọng thực tế trên toàn app
    const totalOverdue = allTasks.filter(t => !t.completed && (t as any).isOverdue).length + 
                         allTodos.filter(t => !t.completed && (t as any).isOverdue).length;

    // Tính phần trăm tiến độ hoàn thành thực tế toàn bộ hệ thống
    let productivityText = 'Chưa bắt đầu';
    if (totalItems > 0) {
      const percentage = completedItems / totalItems;
      if (percentage === 1) productivityText = 'Hoàn thành xuất sắc';
      else if (percentage >= 0.7) productivityText = 'Năng suất tốt';
      else if (percentage >= 0.4) productivityText = 'Đang tiến triển';
      else if (percentage > 0) productivityText = 'Mới bắt đầu';
    }

    // Thiết lập chuỗi text thông báo đầy đủ thông số cho bạn
    let subtitleStr = totalItems > 0
      ? `Đã làm ${completedItems}/${totalItems} việc • Còn ${pendingItems} việc chưa xong`
      : 'Hệ thống chưa có công việc nào';

    // Đính kèm số lượng quá hạn của toàn hệ thống
    if (totalOverdue > 0) {
      subtitleStr += ` (${totalOverdue} việc quá hạn!)`;
    }

    return {
      completed: completedItems,
      total: totalItems,
      subtitle: subtitleStr,
    };
  }, [allTasks, allTodos]); // Khóa cứng theo mảng tổng, đổi tab dưới danh sách thoải mái không ảnh hưởng

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      footer={<TasksFAB bottomOffset={bottomChrome + 16} onPress={() => setIsModalVisible(true)} />}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true, true, true)} 
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        )
      }}
    >
      <View style={styles.listGroup}>
        {/* Thanh tiến độ cố định tổng quan */}
        <TasksProgressCard progress={progressData} />

        <View style={styles.filterWrapper}>
          <TaskFilterChips
            filters={TASK_FILTERS}
            activeId={activeFilter}
            onChange={setActiveFilter}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.container}>
            
            {/* DANH SÁCH LỌC CHẠY ĐỘNG THEO TỪNG TAB BÊN DƯỚI */}
            {tasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>
                    {activeFilter === 'overdue' ? 'Lịch hẹn quá hạn' : 'Công việc & Lịch hẹn'}
                  </Text>
                </View>
                {tasks.map((task, index) => (
                  <TaskListItem
                    key={`task-${task.id}`}
                    task={task}
                    index={index}
                    onToggle={(id) => handleToggleTask(id, task.completed, 'task')}
                    onPress={() => setSelectedItem(task)}
                    onDelete={() => handleDeleteItem(task)}
                  />
                ))}
              </View>
            )}

            {todos.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>
                    {activeFilter === 'overdue' ? 'Danh sách việc quá hạn' : 'Việc cần làm'}
                  </Text>
                </View>
                {todos.map((todo, index) => (
                  <TaskListItem
                    key={`todo-${todo.id}`}
                    task={todo}
                    index={index}
                    onToggle={(id) => handleToggleTask(id, todo.completed, 'todo')}
                    onPress={() => setSelectedItem(todo)}
                    onDelete={() => handleDeleteItem(todo)}
                  />
                ))}
              </View>
            )}

            {tasks.length === 0 && todos.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="text-box-search-outline" size={64} color={COLORS.outlineVariant} />
                <Text style={styles.emptyText}>Không có công việc nào trong danh mục này.</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <CreateTaskModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSaved={() => fetchData(true, true, true)} 
        onOptimisticCreate={handleOptimisticCreate}
        onVoicePress={() => setIsVoiceModalVisible(true)}
      />

      <TaskDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaved={() => fetchData(true, true, true)} 
        onOptimisticUpdate={handleOptimisticUpdate}
        onDelete={(item) => handleDeleteItem(item)}
        onToggleCompletion={(item) => handleToggleTask(item.id, item.completed, item.itemType)}
      />

      <VoiceTaskModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onSaved={() => fetchData(true, true, true)} 
      />
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: { gap: 16 },
  listGroup: { width: '100%', gap: 16 },
  filterWrapper: { marginTop: -4 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabel: { ...typography.titleMd, fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  emptyContainer: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { ...typography.bodyLg, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },
});