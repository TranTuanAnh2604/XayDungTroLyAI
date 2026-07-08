import { TextStyle } from 'react-native';
import { ThemeColors, LIGHT_COLORS } from './theme';

export const FONT_FAMILY = {
  regular: undefined as string | undefined,
  semibold: undefined as string | undefined,
  bold: undefined as string | undefined,
};

export const getTypography = (COLORS: ThemeColors) => ({
  displayLgMobile: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
    fontWeight: '600',
    color: COLORS.onSurface,
  } as TextStyle,
  headlineMd: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    fontWeight: '600',
    color: COLORS.onSurface,
  } as TextStyle,
  headlineSm: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
    fontWeight: '600',
    color: COLORS.onSurface,
  } as TextStyle,
  statLg: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.onSurface,
  } as TextStyle,
  taskMeta: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  } as TextStyle,
  bodyLg: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
    color: COLORS.onSurface,
  } as TextStyle,
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: COLORS.onSurfaceVariant,
  } as TextStyle,
  labelCaps: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
  } as TextStyle,
  linkSmall: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.primary,
  } as TextStyle,
} as const);

export const typography = getTypography(LIGHT_COLORS);
