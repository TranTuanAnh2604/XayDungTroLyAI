import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

type HomeFABProps = {
  onPress?: () => void;
  bottomOffset?: number;
};

export default function HomeFAB({ onPress, bottomOffset = 96 }: HomeFABProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: bottomOffset },
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
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
