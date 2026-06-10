import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppLogo from '../ui/AppLogo';
import { APP_NAME } from '../../constants/brand';
import { typography } from '../../constants/typography';

type AuthHeroBrandingProps = {
  title?: string;
  subtitle?: string;
};

export default function AuthHeroBranding({
  title = APP_NAME,
  subtitle = 'Trợ lý thông minh cho tương lai của bạn.',
}: AuthHeroBrandingProps) {
  return (
    <View style={styles.container}>
      <AppLogo size={88} style={styles.logo} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
