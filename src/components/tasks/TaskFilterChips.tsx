import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
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

const styles = StyleSheet.create({
  scroll: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 24,
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
