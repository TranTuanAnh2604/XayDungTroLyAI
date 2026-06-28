import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type GmailConnectBannerProps = {
  visible: boolean;
};

export default function GmailConnectBanner({ visible }: GmailConnectBannerProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      pulse.setValue(1);
      return;
    }

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Animated.View style={[styles.dot, { opacity: pulse }]} />
        <Text style={styles.label}>Đang kết nối Gmail</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.primaryTint10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  label: {
    ...typography.labelCaps,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
