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
  // Stable animated values — created once, never recreated.
  const translateY = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const rotate     = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;

  // Tracks the last scroll position so we can detect direction.
  const lastScrollY = useRef(0);
  // Tracks whether the FAB is currently in the "hidden" (scrolling-down) state.
  // Initialised to false → FAB starts visible.
  const isHidden = useRef(false);
  // Holds the single running CompositeAnimation so it can be cancelled cleanly.
  const runningAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Starts the show/hide transition. Only called when the state flips.
  const animate = (hide: boolean) => {
    // Cancel anything still running before we start the new animation.
    runningAnim.current?.stop();

    const anim = Animated.parallel([
      Animated.spring(translateY, {
        toValue: hide ? 10 : 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: hide ? 0.9 : 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: hide ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: hide ? 0.7 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    runningAnim.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        runningAnim.current = null;
      }
    });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldHide = y > lastScrollY.current && y > 20;
    lastScrollY.current = y;

    // Only trigger an animation when the visibility state actually changes.
    // This means at most one animation per direction-reversal instead of one
    // animation object being created and started every 16 ms.
    if (shouldHide !== isHidden.current) {
      isHidden.current = shouldHide;
      animate(shouldHide);
    }
  };

  // Call this inside a useEffect cleanup to stop any running animation when
  // the consuming component unmounts (e.g. navigating away from Mail).
  const cleanup = () => {
    runningAnim.current?.stop();
    runningAnim.current = null;
  };

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return { onScroll, cleanup, translateY, scale, spin, opacity };
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
