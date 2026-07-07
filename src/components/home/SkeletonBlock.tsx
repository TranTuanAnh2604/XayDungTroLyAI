import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type SkeletonBlockProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Animated shimmer placeholder used inside skeleton loading states.
 * Pulse animation uses the native driver for smooth performance.
 * The outer View handles width/height/borderRadius; the Animated.View
 * applies only opacity so that the native driver can be used safely.
 */
export default function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonBlockProps) {
  const { colors: COLORS } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: COLORS.surfaceContainer, opacity },
        ]}
      />
    </View>
  );
}
