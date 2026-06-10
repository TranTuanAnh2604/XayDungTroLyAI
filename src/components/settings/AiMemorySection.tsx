import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AiMemoryCard from './AiMemoryCard';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { AiMemoryItem } from '../../types/settings';

type AiMemorySectionProps = {
  items: AiMemoryItem[];
  onAddContext?: () => void;
};

export default function AiMemorySection({
  items,
  onAddContext,
}: AiMemorySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <MaterialIcons name="memory" size={22} color={COLORS.secondary} />
        <Text style={styles.title}>Bộ nhớ & Ngữ cảnh AI</Text>
      </View>
      {items.map((item) => (
        <AiMemoryCard key={item.id} item={item} />
      ))}
      <Pressable
        onPress={onAddContext}
        style={({ pressed }) => [
          styles.addBtn,
          pressed && styles.addPressed,
        ]}
      >
        <MaterialIcons name="add-circle" size={22} color={COLORS.outline} />
        <Text style={styles.addText}>Thêm ngữ cảnh mới</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    ...typography.labelCaps,
    color: COLORS.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.xl,
  },
  addPressed: {
    borderColor: COLORS.primary,
  },
  addText: {
    ...typography.bodyMd,
    color: COLORS.outline,
  },
});
