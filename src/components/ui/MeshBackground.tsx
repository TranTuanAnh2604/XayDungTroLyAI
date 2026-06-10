import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

type MeshBackgroundProps = {
  variant?: 'login' | 'register';
};

export default function MeshBackground({ variant = 'login' }: MeshBackgroundProps) {
  const pulse1 = useRef(new Animated.Value(0.6)).current;
  const pulse2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = loop(pulse1, 0);
    const a2 = loop(pulse2, 2000);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [pulse1, pulse2]);

  const isRegister = variant === 'register';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[COLORS.background, COLORS.surfaceContainerLow]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.meshSpot,
          isRegister ? styles.meshRegisterTopLeft : styles.meshTopLeft,
          {
            backgroundColor: isRegister ? COLORS.meshPrimary : COLORS.meshPurple,
          },
        ]}
      />
      <View
        style={[
          styles.meshSpot,
          isRegister ? styles.meshRegisterTopRight : styles.meshBottomRight,
          {
            backgroundColor: isRegister ? COLORS.meshPurple : COLORS.meshPrimary,
          },
        ]}
      />
      {isRegister ? (
        <>
          <View
            style={[
              styles.glowOrb,
              styles.glowRegisterTopRight,
              { backgroundColor: COLORS.secondaryGlow },
            ]}
          />
          <View
            style={[
              styles.glowOrb,
              styles.glowRegisterBottomLeft,
              { backgroundColor: COLORS.primaryGlow },
            ]}
          />
        </>
      ) : (
        <>
          <Animated.View
            style={[
              styles.glowOrb,
              styles.glowLeft,
              { opacity: pulse1, backgroundColor: COLORS.secondaryGlow },
            ]}
          />
          <Animated.View
            style={[
              styles.glowOrb,
              styles.glowRight,
              { opacity: pulse2, backgroundColor: COLORS.primaryGlow },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  meshSpot: {
    position: 'absolute',
    borderRadius: 9999,
  },
  meshTopLeft: {
    width: 280,
    height: 280,
    top: -80,
    left: -80,
    opacity: 1,
  },
  meshBottomRight: {
    width: 320,
    height: 320,
    bottom: -100,
    right: -100,
    opacity: 1,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glowLeft: {
    width: 256,
    height: 256,
    top: '20%',
    left: -80,
  },
  glowRight: {
    width: 320,
    height: 320,
    bottom: '10%',
    right: -80,
  },
  meshRegisterTopLeft: {
    width: 240,
    height: 240,
    top: 0,
    left: 0,
    opacity: 1,
  },
  meshRegisterTopRight: {
    width: 240,
    height: 240,
    top: 0,
    right: 0,
    opacity: 1,
  },
  glowRegisterTopRight: {
    width: 256,
    height: 256,
    top: '-10%',
    right: '-10%',
  },
  glowRegisterBottomLeft: {
    width: 320,
    height: 320,
    bottom: '-5%',
    left: '-5%',
  },
});
