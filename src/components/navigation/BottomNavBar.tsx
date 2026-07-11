import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_TABS } from '../../data/navigationTabs';
import {
  BOTTOM_NAV_MIN_INSET,
  BOTTOM_NAV_Z_INDEX,
} from '../../constants/layout';
import { getTypography } from '../../constants/typography';
import { useTheme } from '../../hooks/useTheme';
import type { AppTabId } from '../../types/navigation';
import IosGlassView from '../ui/IosGlassView';

export type BottomNavBarProps = {
  activeTab: AppTabId;
  scrollPosition?: any;
  onTabPress?: (tab: AppTabId) => void;
};

// Enable LayoutAnimation on Android for old architecture
const isFabric = typeof global !== 'undefined' && !!(global as any).nativeFabricUIManager;
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !isFabric
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BottomNavBar({
  activeTab,
  scrollPosition,
  onTabPress,
}: BottomNavBarProps) {

  const insets = useSafeAreaInsets();
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  const bottomOffset = Math.max(insets.bottom, BOTTOM_NAV_MIN_INSET);

  const [measurements, setMeasurements] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  const fallbackScroll = useRef(new Animated.Value(APP_TABS.findIndex(t => t.id === activeTab))).current;

  useEffect(() => {
    if (!scrollPosition) {
      Animated.spring(fallbackScroll, {
        toValue: APP_TABS.findIndex(t => t.id === activeTab),
        useNativeDriver: false,
        friction: 7,
        tension: 40,
      }).start();
    }
  }, [activeTab, scrollPosition, fallbackScroll]);

  const animatedScroll = scrollPosition || fallbackScroll;
  const inputRange = APP_TABS.map((_, i) => i);
  
  const hasMeasurements = Object.keys(measurements).length > 0;
  const outputX = APP_TABS.map((t) => measurements[t.id]?.x || 0);
  const outputWidth = APP_TABS.map((t) => measurements[t.id]?.width || 52);
  const outputHeight = APP_TABS.map((t) => measurements[t.id]?.height || 30);
  const outputY = APP_TABS.map((t) => measurements[t.id]?.y || 6);

  const translateX = animatedScroll.interpolate({
    inputRange,
    outputRange: hasMeasurements ? outputX : [0,0,0,0,0],
    extrapolate: 'clamp',
  });
  const indicatorWidth = animatedScroll.interpolate({
    inputRange,
    outputRange: hasMeasurements ? outputWidth : [0,0,0,0,0],
    extrapolate: 'clamp',
  });
  const indicatorHeight = animatedScroll.interpolate({
    inputRange,
    outputRange: hasMeasurements ? outputHeight : [0,0,0,0,0],
    extrapolate: 'clamp',
  });
  const indicatorY = animatedScroll.interpolate({
    inputRange,
    outputRange: hasMeasurements ? outputY : [0,0,0,0,0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <IosGlassView variant="regular" style={styles.bar} fillOpacity={0.1}>
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              left: 0,
              top: 0,
              opacity: hasMeasurements ? 1 : 0,
              width: indicatorWidth,
              height: indicatorHeight,
              transform: [{ translateX }, { translateY: indicatorY }],
            },
          ]}
        />
        {APP_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                setMeasurements((prev) => ({
                  ...prev,
                  [tab.id]: { x, y, width, height },
                }));
              }}
              onPress={() => {
                onTabPress?.(tab.id);
              }}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && !active && styles.tabPressed,
              ]}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={active ? COLORS.tabActive : COLORS.tabInactive}
              />
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </IosGlassView>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    zIndex: BOTTOM_NAV_Z_INDEX,
    maxWidth: 512,
    alignSelf: 'center',
    width: '92%',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 52,
    borderRadius: 9999,
  },
  tabActive: {
    paddingHorizontal: 16,
    transform: [{ scale: 1.05 }],
  },
  activeIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  label: {
    ...typography.labelCaps,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.tabInactive,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: COLORS.tabActive,
  },
});
