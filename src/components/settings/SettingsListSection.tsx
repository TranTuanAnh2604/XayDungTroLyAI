import React, { useContext, useState, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppGlassCard from '../ui/AppGlassCard';
import { getTypography } from '../../constants/typography';
import { ThemeContext } from '../../context/ThemeContext';
import type { SettingsListSection as SettingsListSectionType } from '../../types/settings';
import type { ThemeMode } from '../../context/ThemeContext';

type SettingsListSectionProps = {
  section: SettingsListSectionType;
  onItemPress?: (itemId: string) => void;
};

export default function SettingsListSection({
  section,
  onItemPress,
}: SettingsListSectionProps) {
  const { theme, setTheme, colors: COLORS } = useContext(ThemeContext);
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

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
            
            {item.type === 'segmented' ? (
              <View style={styles.segmentedRow}>
                <View style={styles.left}>
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                <View style={styles.segmentContainer}>
                  {item.segments?.map((segment) => {
                    const isSelected = item.id === 'appearance' && theme === segment.value;
                    return (
                      <Pressable
                        key={segment.value}
                        style={[
                          styles.segmentButton,
                          isSelected && styles.segmentButtonSelected,
                        ]}
                        onPress={() => {
                          if (item.id === 'appearance') {
                            setTheme(segment.value as ThemeMode);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            isSelected && styles.segmentTextSelected,
                          ]}
                        >
                          {segment.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : item.type === 'toggle' ? (
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
                  onValueChange={(value) => {
                    setToggles((prev) => ({ ...prev, [item.id]: value }));
                  }}
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

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
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
  segmentedRow: {
    padding: 16,
    gap: 16,
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
    color: COLORS.onSurfaceVariant,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
    marginLeft: 56,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonSelected: {
    backgroundColor: COLORS.surface,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.onSurface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: COLORS.onSurface,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  segmentText: {
    ...typography.bodyMd,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
  },
  segmentTextSelected: {
    color: COLORS.onSurface,
  },
});
