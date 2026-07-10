import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { DEFAULT_APP_TITLE } from '../../constants/navigationChrome';
import { TOP_APP_BAR_HEIGHT, TOP_APP_BAR_Z_INDEX } from '../../constants/layout';
import { getTypography } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
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
  /** Extra leading control (e.g. menu button) */
  leftActions?: ReactNode;
};

const LOGO_SIZE = 28;

export default function TopAppBar({
  title = DEFAULT_APP_TITLE,
  onTitlePress,
  onSettingsPress,
  showBack = false,
  onBackPress,
  rightActions,
  leftActions,
}: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleTitlePress = onTitlePress || (() => {
    navigation.navigate('Main', { tab: 'home' });
  });
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/*
       * The IosGlassView is stretched upward by insets.top so the blur covers
       * the entire band from the very top of the screen (behind the status bar)
       * through the content row. The wrapper itself has no background or
       * overflow clipping — only the BlurView provides the visual fill.
       */}
      <IosGlassView
        variant="chrome"
        style={[
          StyleSheet.absoluteFill,
          { top: -insets.top },
          styles.glassFix,
        ]}
      />

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
            <View style={styles.leading}>
              {leftActions}
              <Pressable
                onPress={handleTitlePress}
                style={({ pressed }) => [
                  styles.brand,
                  pressed && styles.pressed,
                ]}
              >
                <AppLogo size={LOGO_SIZE} />
                <Text style={styles.title}>{title}</Text>
              </Pressable>
            </View>

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

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: TOP_APP_BAR_Z_INDEX,
    backgroundColor: 'transparent',
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
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  glassFix: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
});
