import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const PARTICLES = [
  { size: 8, top: '20%' as const, left: '10%' as const, color: `${COLORS.primary}33`, delay: 0, duration: 10000 },
  { size: 12, top: '60%' as const, left: '80%' as const, color: `${COLORS.secondary}26`, delay: 2000, duration: 12000 },
  { size: 6, top: '15%' as const, left: '70%' as const, color: `${COLORS.primary}1A`, delay: 5000, duration: 8000 },
  { size: 16, top: '85%' as const, left: '25%' as const, color: `${COLORS.secondary}1A`, delay: 1000, duration: 15000 },
];

export default function AmbientParticles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, index) => (
        <FloatingParticle key={index} {...p} />
      ))}
    </View>
  );
}

function FloatingParticle({
  size,
  top,
  left,
  color,
  delay,
  duration,
}: (typeof PARTICLES)[0]) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 10,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -15,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -5,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -25,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -15,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -10,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration / 4,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration / 4,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [delay, duration, translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          top,
          left,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.9,
  },
});
