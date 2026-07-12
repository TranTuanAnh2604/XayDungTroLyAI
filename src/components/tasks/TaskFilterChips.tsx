import { getTypography } from '../../constants/typography';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {filters.map((filter) => {
        const active = filter.id === activeId;
        return (
          <Pressable
            key={filter.id}
            onPress={() => onChange?.(filter.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  scroll: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 0,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}4D`,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.outline,
    textTransform: 'none',
    letterSpacing: 0,
  },
  labelActive: {
    color: COLORS.onPrimary,
  },
});
