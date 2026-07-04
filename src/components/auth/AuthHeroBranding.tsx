import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppLogo from '../ui/AppLogo';
import { APP_NAME } from '../../constants/brand';
import { useTheme } from '../../hooks/useTheme';

type AuthHeroBrandingProps = {
  title?: string;
  subtitle?: string;
};

export default function AuthHeroBranding({
  title = APP_NAME,
  subtitle = 'Trợ lý thông minh cho tương lai của bạn.',
}: AuthHeroBrandingProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS, typography]);
  return (
    <View style={styles.container}>
      <AppLogo size={88} style={styles.logo} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    ...typography.displayLgMobile,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    opacity: 0.8,
    textAlign: 'center',
  },
});
