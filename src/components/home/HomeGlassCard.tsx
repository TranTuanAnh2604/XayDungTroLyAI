import AppGlassCard, {
  type AppGlassCardVariant,
} from '../ui/AppGlassCard';
import type { PropsWithChildren } from 'react';
import type { ViewStyle } from 'react-native';

type HomeGlassCardProps = PropsWithChildren<{
  style?: ViewStyle;
  variant?: AppGlassCardVariant;
  glow?: boolean;
  tint?: boolean;
  padding?: number;
}>;

/** @deprecated Prefer `AppGlassCard` from `components/ui/AppGlassCard` */
export default function HomeGlassCard(props: HomeGlassCardProps) {
  return <AppGlassCard {...props} />;
}

export type { AppGlassCardVariant };
