import React, { useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type ComposeFABProps = {
  bottomOffset?: number;
  onPress?: () => void;
};

export function useComposeFabScroll() {
  const lastScrollY = useRef(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const scrollingDown = y > lastScrollY.current && y > 20;
    lastScrollY.current = y;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: scrollingDown ? 10 : 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: scrollingDown ? 0.9 : 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: scrollingDown ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: scrollingDown ? 0.7 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return { onScroll, translateY, scale, spin, opacity };
}

export default function ComposeFAB({
  bottomOffset = 96,
  onPress,
  translateY,
  scale,
  spin,
  opacity,
}: ComposeFABProps & {
  translateY: Animated.Value;
  scale: Animated.Value;
  spin: Animated.AnimatedInterpolation<string>;
  opacity: Animated.Value;
}) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
          opacity,
          transform: [{ translateY }, { scale }, { rotate: spin }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <MaterialIcons name="edit" size={28} color={COLORS.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 32,
    zIndex: 50,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
