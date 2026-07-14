import React, { useRef, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Animated,
  View
} from 'react-native';
import { getTypography } from '../../constants/typography';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

import type { TaskFilterId } from '../../types/tasks';

type FilterOption = { id: TaskFilterId; label: string };

type TaskFilterChipsProps = {
  filters: FilterOption[];
  activeId: TaskFilterId;
  onChange?: (id: TaskFilterId) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FilterChip = ({
  filter,
  active,
  onPress,
  COLORS,
  styles,
}: {
  filter: FilterOption;
  active: boolean;
  onPress: () => void;
  COLORS: any;
  styles: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  };

  const backgroundColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.surface, COLORS.primary],
  });

  const borderColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.outlineVariant, COLORS.primary],
  });

  const textColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.textSecondary, COLORS.onPrimary],
  });

  // Khi chưa active, có bóng đổ cực nhẹ hoặc border xám. 
  // Để giao diện sạch, mình dùng border xám nhạt và nền màu trắng/surface.

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.chip,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor,
          borderColor,
        },
        active && styles.chipActiveShadow
      ]}
    >
      <Animated.Text style={[styles.label, { color: textColor }]}>
        {filter.label}
      </Animated.Text>
    </AnimatedPressable>
  );
};

export default function TaskFilterChips({
  filters,
  activeId,
  onChange,
}: TaskFilterChipsProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {filters.map((filter) => (
          <FilterChip
            key={filter.id}
            filter={filter}
            active={filter.id === activeId}
            onPress={() => onChange?.(filter.id)}
            COLORS={COLORS}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    // Đảm bảo thẳng lề trái với danh sách task bên dưới
    marginLeft: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingVertical: 12,
  },
  scroll: {
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActiveShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
