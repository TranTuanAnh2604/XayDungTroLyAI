import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import {
  IOS_GLASS_ANDROID_INTENSITY,
  IOS_GLASS_FILL_OPACITY,
  IOS_GLASS_IOS_INTENSITY,
} from '../../constants/layout';

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
      {fillOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(255, 255, 255, ${fillOpacity})` },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
