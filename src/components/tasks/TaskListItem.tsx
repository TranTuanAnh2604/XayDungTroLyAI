import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { TaskItem, TaskPriority } from '../../types/tasks';

type TaskListItemProps = {
  task: TaskItem;
  index?: number;
  onToggle?: (id: string, completed: boolean) => void;
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Cao',
  normal: 'Thường',
  low: 'Thấp',
};

export default function TaskListItem({
  task,
  index = 0,
  onToggle,
}: TaskListItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 75,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle?.(task.id, !task.completed);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <AppGlassCard variant="surface" padding={16} style={styles.cardWrap}>
        <View style={styles.row}>
        <View style={styles.left}>
          <Pressable
            onPress={handleToggle}
            style={[
              styles.checkbox,
              task.completed && styles.checkboxDone,
            ]}
          >
            {task.completed && (
              <MaterialIcons name="check" size={18} color={COLORS.onPrimary} />
            )}
          </Pressable>
          <View style={styles.textCol}>
            <Text
              style={[styles.title, task.completed && styles.titleDone]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <Text
              style={[
                styles.meta,
                task.completed && styles.metaDone,
              ]}
            >
              {task.meta}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <PriorityBadge priority={task.priority} completed={task.completed} />
          <Pressable hitSlop={8}>
            <MaterialIcons
              name="more-vert"
              size={20}
              color={COLORS.outlineVariant}
            />
          </Pressable>
        </View>
        </View>
      </AppGlassCard>
    </Animated.View>
  );
}

function PriorityBadge({
  priority,
  completed,
}: {
  priority: TaskPriority;
  completed: boolean;
}) {
  if (completed) {
    return (
      <View style={[styles.badge, styles.badgeMuted]}>
        <Text style={[styles.badgeText, styles.badgeTextMuted]}>
          {PRIORITY_LABEL[priority]}
        </Text>
      </View>
    );
  }

  const isHigh = priority === 'high';
  return (
    <View
      style={[
        styles.badge,
        isHigh ? styles.badgeHigh : styles.badgeNormal,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isHigh ? styles.badgeTextHigh : styles.badgeTextNormal,
        ]}
      >
        {PRIORITY_LABEL[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.bodyMd,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.outline,
  },
  meta: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: COLORS.outline,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  metaDone: {
    color: COLORS.outlineVariant,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeHigh: {
    backgroundColor: COLORS.errorTint,
  },
  badgeNormal: {
    backgroundColor: `${COLORS.primary}1A`,
  },
  badgeMuted: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badgeTextHigh: {
    color: COLORS.error,
  },
  badgeTextNormal: {
    color: COLORS.primary,
  },
  badgeTextMuted: {
    color: COLORS.outline,
  },
});
