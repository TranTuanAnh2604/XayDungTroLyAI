import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { QuickAction } from '../../types/chat';

type QuickActionChipsProps = {
  actions: QuickAction[];
  onPress?: (action: QuickAction) => void;
};

export default function QuickActionChips({
  actions,
  onPress,
}: QuickActionChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={() => onPress?.(action)}
          style={({ pressed }) => [
            styles.chip,
            pressed && styles.chipPressed,
          ]}
        >
          <Text style={styles.chipText}>{action.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipPressed: {
    backgroundColor: COLORS.primaryFixed,
    borderColor: `${COLORS.primary}66`,
    transform: [{ scale: 0.95 }],
  },
  chipText: {
    ...typography.labelCaps,
    color: COLORS.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
