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
import type { MailFilterId } from '../../types/mail';

type FilterOption = { id: MailFilterId; label: string; count?: number };

type MailFilterBarProps = {
  filters: FilterOption[];
  activeId: MailFilterId;
  onChange?: (id: MailFilterId) => void;
};

export default function MailFilterBar({
  filters,
  activeId,
  onChange,
}: MailFilterBarProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(72)).current;
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  // Stop the previous spring before starting the next one. Without this,
  // tapping filter chips quickly queues concurrent animations on the same
  // native nodes and causes the NativeAnimatedModule frame-index crash.
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const layout = layouts[activeId];
    if (!layout) return;

    // Cancel any in-flight indicator animation.
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
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
                style={[styles.chip, filter.count !== undefined && filter.count > 0 && styles.chipWithCount]}
              >
                {filter.count !== undefined && filter.count > 0 && (
                  <View style={[styles.badge, active && styles.badgeActive]}>
                    <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                      {filter.count}
                    </Text>
                  </View>
                )}
                <Text style={[styles.label, active && styles.labelActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
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
  scroll: {
    paddingHorizontal: 4,
  },
  content: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    padding: 4,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 1,
  },
  chipWithCount: {
    gap: 6,
  },
  badge: {
    backgroundColor: COLORS.surfaceVariant,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeActive: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  badgeTextActive: {
    color: COLORS.onPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tabInactive,
  },
  labelActive: {
    color: COLORS.tabActive,
  },
});
