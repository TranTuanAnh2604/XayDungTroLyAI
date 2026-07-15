import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { TaskFilterId } from '../../types/tasks';

type FilterOption = { id: TaskFilterId; label: string };

type TaskFilterChipsProps = {
  filters: FilterOption[];
  activeId: TaskFilterId;
  onChange?: (id: TaskFilterId) => void;
};

export default function TaskFilterChips({
  filters,
  activeId,
  onChange,
}: TaskFilterChipsProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(72)).current;
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const layout = layouts[activeId];
    if (!layout) return;

    runningAnim.current?.stop();

    const anim = Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x,
        useNativeDriver: false,
        friction: 8,
      }),
      Animated.spring(indicatorW, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 8,
      }),
    ]);
    runningAnim.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        runningAnim.current = null;
      }
    });
  }, [activeId, indicatorW, indicatorX, layouts]);

  const onLayoutItem = (id: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => ({ ...prev, [id]: { x, width } }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorX,
              width: indicatorW,
            },
          ]}
        />
        {filters.map((filter) => {
          const active = filter.id === activeId;
          return (
            <Pressable
              key={filter.id}
              onLayout={onLayoutItem(filter.id)}
              onPress={() => onChange?.(filter.id)}
              style={styles.chip}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    height: 32,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    padding: 4,
    gap: 4,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tabInactive || COLORS.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.tabActive || COLORS.onSurface,
  },
});
