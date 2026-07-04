import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

type TasksFABProps = {
  onPress?: () => void;
  bottomOffset?: number;
};

export default function TasksFAB({ onPress, bottomOffset = 96 }: TasksFABProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [floatAnim]);

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: bottomOffset, transform: [{ translateY: floatAnim }] }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 24,
    zIndex: 40,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
