import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import AppGlassCard from './AppGlassCard';

type GlassCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /** @deprecated Auth cards now use the shared AI glass style */
  tone?: 'login' | 'register';
}>;

/** Auth form shell — lavender AI glass (matches Events insight cards). */
export default function GlassCard({ children, style }: GlassCardProps) {
  return (
    <AppGlassCard variant="ai" padding={32} style={style}>
      {children}
    </AppGlassCard>
  );
}
