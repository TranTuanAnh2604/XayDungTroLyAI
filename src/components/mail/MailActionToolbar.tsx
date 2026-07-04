import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type MailActionToolbarProps = {
  isPinned?: boolean;
  isArchived?: boolean;
  onPinPress?: () => void;
  onArchivePress?: () => void;
  disabled?: boolean;
};

export default function MailActionToolbar({
  isPinned = false,
  isArchived = false,
  onPinPress,
  onArchivePress,
  disabled = false,
}: MailActionToolbarProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  // UI reflects parent state (`isPinned` / `isArchived`) and does not maintain local toggle.
  // Parent is responsible for updating state after server confirmation.

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPinPress}
        style={({ pressed }) => [
          styles.actionButton,
          pressed && !disabled && styles.actionButtonPressed,
          isPinned ? styles.activePinButton : styles.inactiveActionButton,
        ]}
      >
        <MaterialIcons
          name={isPinned ? 'star' : 'star-border'}
          size={18}
          color={isPinned ? COLORS.secondary : COLORS.onSurfaceVariant}
        />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onArchivePress}
        style={({ pressed }) => [
          styles.actionButton,
          pressed && !disabled && styles.actionButtonPressed,
          isArchived ? styles.activeArchiveButton : styles.inactiveActionButton,
          { marginRight: 0 },
        ]}
      >
        <MaterialIcons
          name={'archive'}
          size={18}
          color={isArchived ? COLORS.primary : COLORS.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // 'gap' is not supported across all RN versions; use margins on buttons instead
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.outlineVariant}80`,
    backgroundColor: COLORS.surfaceContainerLowest,
    marginRight: 8,
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  inactiveActionButton: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  activePinButton: {
    backgroundColor: `${COLORS.secondary}14`,
    borderColor: `${COLORS.secondary}66`,
  },
  activeArchiveButton: {
    backgroundColor: `${COLORS.primary}14`,
    borderColor: `${COLORS.primary}66`,
  },
});
