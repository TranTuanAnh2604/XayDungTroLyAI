import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { SettingsListSection as SettingsListSectionType } from '../../types/settings';

type SettingsListSectionProps = {
  section: SettingsListSectionType;
  onItemPress?: (itemId: string) => void;
};

export default function SettingsListSection({
  section,
  onItemPress,
}: SettingsListSectionProps) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      section.items
        .filter((i) => i.type === 'toggle')
        .map((i) => [i.id, i.toggleDefault ?? false]),
    ),
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <AppGlassCard variant="surface" padding={0}>
        {section.items.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <View style={styles.divider} />}
            {item.type === 'toggle' ? (
              <View style={styles.row}>
                <View style={styles.left}>
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                <Switch
                  value={toggles[item.id] ?? false}
                  onValueChange={(value) =>
                    setToggles((prev) => ({ ...prev, [item.id]: value }))
                  }
                  trackColor={{
                    false: COLORS.outlineVariant,
                    true: COLORS.primary,
                  }}
                  thumbColor={COLORS.white}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => onItemPress?.(item.id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.left}>
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={COLORS.onSurfaceVariant}
                  />
                  <View>
                    <Text style={styles.label}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={styles.subtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.right}>
                  {item.value ? (
                    <Text style={styles.value}>{item.value}</Text>
                  ) : null}
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color={COLORS.outline}
                  />
                </View>
              </Pressable>
            )}
          </View>
        ))}
      </AppGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.labelCaps,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    marginLeft: 4,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    ...typography.bodyLg,
    color: COLORS.onSurface,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  value: {
    ...typography.bodyMd,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
    marginLeft: 56,
  },
});
