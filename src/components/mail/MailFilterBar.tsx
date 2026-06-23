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
import { COLORS, RADIUS } from '../../constants/theme';
import type { MailFilterId } from '../../types/mail';

type FilterOption = { id: MailFilterId; label: string };

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
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(72)).current;
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = layouts[activeId];
    if (!layout) return;
    Animated.parallel([
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
    ]).start();
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
                style={styles.chip}
              >
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    height: 40,
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    height: 32,
    backgroundColor: COLORS.primaryTint10,
    borderRadius: RADIUS.full,
  },
  scroll: {
    paddingHorizontal: 4,
  },
  content: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.outline,
  },
  labelActive: {
    color: COLORS.primary,
  },
});
