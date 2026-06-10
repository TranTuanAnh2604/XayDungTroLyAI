import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_APP_TITLE } from '../../constants/navigationChrome';
import { TOP_APP_BAR_HEIGHT, TOP_APP_BAR_Z_INDEX } from '../../constants/layout';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import AppLogo from '../ui/AppLogo';
import IosGlassView from '../ui/IosGlassView';

export type TopAppBarProps = {
  title?: string;
  onTitlePress?: () => void;
  onSettingsPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  /** Extra trailing control (e.g. voice → chat); shown before settings */
  rightActions?: ReactNode;
};

const LOGO_SIZE = 28;

export default function TopAppBar({
  title = DEFAULT_APP_TITLE,
  onTitlePress,
  onSettingsPress,
  showBack = false,
  onBackPress,
  rightActions,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <IosGlassView variant="chrome" style={StyleSheet.absoluteFill} />

      <View style={styles.bar}>
        {showBack ? (
          <>
            <Pressable
              onPress={onBackPress}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={COLORS.onSurface}
              />
            </Pressable>
            <Text style={styles.titleCentered} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.trailing}>
              {rightActions ?? <View style={styles.sidePlaceholder} />}
            </View>
          </>
        ) : (
          <>
            <Pressable
              onPress={onTitlePress}
              disabled={!onTitlePress}
              style={({ pressed }) => [
                styles.brand,
                onTitlePress && pressed && styles.pressed,
              ]}
            >
              <AppLogo size={LOGO_SIZE} />
              <Text style={styles.title}>{title}</Text>
            </Pressable>

            <View style={styles.trailing}>
              {rightActions}
              {onSettingsPress ? (
                <Pressable
                  onPress={onSettingsPress}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Cài đặt"
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialIcons
                    name="settings"
                    size={24}
                    color={COLORS.primary}
                  />
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: TOP_APP_BAR_Z_INDEX,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.35)',
  },
  bar: {
    height: TOP_APP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerMobile,
    maxWidth: 672,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  title: {
    ...typography.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: COLORS.onSurface,
  },
  titleCentered: {
    ...typography.headlineMd,
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: COLORS.onSurface,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 24,
    justifyContent: 'flex-end',
  },
  sidePlaceholder: {
    width: 24,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
