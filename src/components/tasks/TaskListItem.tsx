import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { getTypography } from '../../constants/typography';
import type { ExtendedTaskItem, TaskPriority } from '../../types/tasks';
import { useTheme } from '../../hooks/useTheme';

type TaskListItemProps = {
  task: ExtendedTaskItem;
  index?: number;
  onToggle?: (id: string, completed: boolean) => void;
  onPress?: (task: any) => void;
  onDelete?: () => void;
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Cao',
  normal: 'Thường',
  low: 'Thấp',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TaskListItem({
  task,
  index = 0,
  onToggle,
  onPress,
  onDelete,
}: TaskListItemProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const [isSwipable, setIsSwipable] = useState(false);
  const isSwipableRef = useRef(isSwipable);
  isSwipableRef.current = isSwipable;
  const isDraggingRef = useRef(false);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSwipable ? 0.95 : 1,
      useNativeDriver: true,
    }).start();

    Animated.timing(bgAnim, {
      toValue: isSwipable ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isSwipable, scaleAnim, bgAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100 + index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 100 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, index, slideAnim]);

  // Lưu trữ các callback và prop vào ref để PanResponder không bị reset giữa chừng
  const actionsRef = useRef({ onDelete, onToggle, task });
  useEffect(() => {
    actionsRef.current = { onDelete, onToggle, task };
  }, [onDelete, onToggle, task]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return isSwipableRef.current; // Bắt lấy sự kiện ngay lập tức nếu đã bật chế độ vuốt
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isSwipableRef.current;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        let newDx = gestureState.dx;
        const limit = SCREEN_WIDTH * 0.35; // Giảm xuống 0.35 để góc bo tròn của thẻ che kín phần nền phân cách
        if (newDx > limit) newDx = limit;
        if (newDx < -limit) newDx = -limit;
        pan.setValue(newDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        setIsSwipable(false);

        const { onDelete: del, onToggle: toggle, task: t } = actionsRef.current;
        const isSwipeLeft = gestureState.dx < -SCREEN_WIDTH * 0.25 || gestureState.vx < -0.5;
        const isSwipeRight = gestureState.dx > SCREEN_WIDTH * 0.25 || gestureState.vx > 0.5;

        if (isSwipeLeft) {
          // Vuốt sang trái -> Xóa (Delete)
          Animated.spring(pan, {
            toValue: 0, // Quay lại vị trí cũ để chờ xác nhận từ hộp thoại xóa
            useNativeDriver: false,
            bounciness: 0,
          }).start(() => del?.());
        } else if (isSwipeRight) {
          // Vuốt sang phải -> Hoàn thành (Complete)
          Animated.spring(pan, {
            toValue: 0, // Quay lại vị trí cũ để hiện gạch ngang
            useNativeDriver: false,
            bounciness: 0,
          }).start(() => toggle?.(t.id, !t.completed));
        } else {
          // Hủy thao tác
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        setIsSwipable(false);
        Animated.spring(pan, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
      }
    })
  ).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 75, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 75, useNativeDriver: true }),
    ]).start();
    onToggle?.(task.id, !task.completed);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={[styles.swipeBackground, { opacity: bgAnim }]}>
        <View style={styles.swipeActionLeft}>
          <MaterialIcons name="check" size={28} color="#fff" />
        </View>
        <View style={styles.swipeActionRight}>
          <MaterialIcons name="delete" size={28} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateX: pan }] }} {...panResponder.panHandlers}>
        <Pressable
          onPress={() => {
            if (!isSwipableRef.current) onPress?.(task);
          }}
          onLongPress={() => {
            isDraggingRef.current = false;
            setIsSwipable(true);
          }}
          delayLongPress={200}
          onPressOut={() => {
            // Đợi một chút để PanResponder có thời gian "cướp" sự kiện trước khi tự tắt
            setTimeout(() => {
              if (!isDraggingRef.current) {
                setIsSwipable(false);
              }
            }, 100);
          }}
        >
          <AppGlassCard variant="surface" padding={14} style={styles.cardWrap}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Pressable
                  onPress={handleToggle}
                  style={[styles.checkbox, task.completed && styles.checkboxDone]}
                >
                  {task.completed && <MaterialIcons name="check" size={18} color="#fff" />}
                </Pressable>
                <View style={styles.textCol}>
                  <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={2}>
                    {task.title}
                  </Text>
                  {!!task.description && task.description !== 'Không có mô tả' && (
                    <Text style={[styles.desc, task.completed && styles.metaDone]} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                  {!!task.dueDate && (
                    <Text style={[styles.meta, task.completed && styles.metaDone]}>
                      Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.right}>
                <PriorityBadge priority={task.priority} completed={task.completed} styles={styles} />
              </View>
            </View>
          </AppGlassCard>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function PriorityBadge({
  priority,
  completed,
  styles,
}: {
  priority: TaskPriority;
  completed: boolean;
  styles: any;
}) {
  if (completed) {
    return (
      <View style={[styles.badge, styles.badgeMuted]}>
        <Text style={[styles.badgeText, styles.badgeTextMuted]}>{PRIORITY_LABEL[priority]}</Text>
      </View>
    );
  }

  const isHigh = priority === 'high';
  return (
    <View style={[styles.badge, isHigh ? styles.badgeHigh : styles.badgeNormal]}>
      <Text style={[styles.badgeText, isHigh ? styles.badgeTextHigh : styles.badgeTextNormal]}>
        {PRIORITY_LABEL[priority]}
      </Text>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) =>
  StyleSheet.create({
    container: { marginBottom: 12 },
    cardWrap: { backgroundColor: COLORS.surfaceContainerLowest },
    swipeBackground: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      overflow: 'hidden',
    },
    swipeActionLeft: {
      paddingHorizontal: 20,
      justifyContent: 'center',
      height: '100%',
      backgroundColor: COLORS.emerald,
      flex: 1,
    },
    swipeActionRight: {
      paddingHorizontal: 20,
      justifyContent: 'center',
      alignItems: 'flex-end',
      height: '100%',
      backgroundColor: COLORS.error,
      flex: 1,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: COLORS.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxDone: { backgroundColor: COLORS.emerald, borderColor: COLORS.emerald },
    textCol: { flex: 1, paddingVertical: 2 },
    title: { ...typography.bodyMd, fontSize: 15, lineHeight: 22, fontWeight: '500', color: COLORS.onSurface },
    titleDone: { textDecorationLine: 'line-through', color: COLORS.outline },
    desc: {
      fontSize: 13,
      lineHeight: 18,
      color: COLORS.onSurfaceVariant || COLORS.textSecondary || '#666',
      marginTop: 2,
    },
    meta: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: COLORS.primary,
      marginTop: 4,
      letterSpacing: 0.1,
    },
    metaDone: { color: COLORS.outline },
    right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeHigh: { backgroundColor: COLORS.errorTint || `${COLORS.error}1A` },
    badgeNormal: { backgroundColor: `${COLORS.primary}1A` },
    badgeMuted: { backgroundColor: COLORS.surfaceContainerHigh },
    badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
    badgeTextHigh: { color: COLORS.error },
    badgeTextNormal: { color: COLORS.primary },
    badgeTextMuted: { color: COLORS.outline },
  });
