import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import {
  IOS_GLASS_ANDROID_INTENSITY,
  IOS_GLASS_FILL_OPACITY,
  IOS_GLASS_IOS_INTENSITY,
} from '../../constants/layout';
import { LinearGradient } from 'expo-linear-gradient';
export type IosGlassVariant = 'chrome' | 'thin' | 'regular';

const IOS_TINT: Record<IosGlassVariant, BlurTint> = {
  chrome: 'systemChromeMaterialLight',
  thin: 'systemUltraThinMaterialLight',
  regular: 'systemMaterialLight',
};

type IosGlassViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: IosGlassVariant;
  intensity?: number;
  /** White wash on top of blur — keep low (iOS uses almost none). */
  fillOpacity?: number;
};

/**
 * Frosted glass like iOS navigation bars (UIBlurEffect systemChromeMaterial).
 */
export default function IosGlassView({
  children,
  style,
  variant = 'chrome',
  intensity,
  fillOpacity = IOS_GLASS_FILL_OPACITY,
}: IosGlassViewProps) {
  const isIos = Platform.OS === 'ios';
  const blurIntensity =
    intensity ?? (isIos ? IOS_GLASS_IOS_INTENSITY : IOS_GLASS_ANDROID_INTENSITY);
  const tint = isIos ? IOS_TINT[variant] : 'light';

  return (
    <View style={[styles.root, style]}>
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        experimentalBlurMethod={
          Platform.OS === 'android' ? 'dimezisBlurView' : undefined
        }
        blurReductionFactor={Platform.OS === 'android' ? 2 : undefined}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
      pointerEvents="none"
      colors={[
        'rgba(255,255,255,0.18)',
        'rgba(255,255,255,0.05)',
        'rgba(255,255,255,0.01)',
      ]}
      style={StyleSheet.absoluteFill}
      />

      {fillOpacity > 0 ? (
        <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.7)',
      }}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
