import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppLogo from '../ui/AppLogo';
import WaveformBars from './WaveformBars';
import { COLORS, RADIUS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type AiCoreVisualizerProps = {
  listeningLabel: string;
  onPress?: () => void;
};

export default function AiCoreVisualizer({
  listeningLabel,
  onPress,
}: AiCoreVisualizerProps) {
  const breath = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const badgeOpacity = useRef(new Animated.Value(0.4)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.25,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    const badgeAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    breathAnim.start();
    spinAnim.start();
    pulseAnim.start();
    badgeAnim.start();

    return () => {
      breathAnim.stop();
      spinAnim.stop();
      pulseAnim.stop();
      badgeAnim.stop();
    };
  }, [badgeOpacity, breath, pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(pressScale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start()
      }
      style={styles.wrapper}
    >
      <Animated.View
        style={[
          styles.auraRing,
          { transform: [{ rotate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.pingRing,
          { transform: [{ scale: pulse }], opacity: 0.15 },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: pulse }], opacity: 0.08 },
        ]}
      />

      <Animated.View
        style={[
          styles.coreOuter,
          {
            transform: [{ scale: Animated.multiply(breath, pressScale) }],
          },
        ]}
      >
        <View style={styles.core}>
          <LinearGradient
            colors={[`${COLORS.primary}1A`, `${COLORS.secondary}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AppLogo size={72} style={styles.coreLogo} />
          <WaveformBars />
        </View>
      </Animated.View>

      <Animated.View style={[styles.badge, { opacity: badgeOpacity }]}>
        <AppLogo size={16} />
        <Text style={styles.badgeText}>{listeningLabel}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    minHeight: 240,
  },
  auraRing: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 2,
    borderColor: `${COLORS.primary}33`,
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.secondary,
    opacity: 0.2,
  },
  pingRing: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: COLORS.primary,
  },
  pulseRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: COLORS.secondary,
  },
  coreOuter: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  core: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  coreLogo: {
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    ...typography.labelCaps,
    color: COLORS.onSecondary,
    letterSpacing: 1,
  },
});
