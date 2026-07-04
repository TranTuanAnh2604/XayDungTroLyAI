import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { getTypography } from '../../../constants/typography';
import { RADIUS } from '../../../constants/theme';

interface TaskFormLayoutProps {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function TaskFormLayout({
  title,
  headerRight,
  children,
  footer,
}: TaskFormLayoutProps) {
  const { colors: COLORS } = useTheme();
  const typography = useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = useMemo(() => createStyles(COLORS, typography), [COLORS]);

  return (
    <View style={styles.modalContent}>
      {(title || headerRight) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}

      <View style={styles.body}>{children}</View>

      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 15,
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      ...typography.headlineMd,
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.onSurface,
      flex: 1,
    },
    headerRight: {
      marginLeft: 16,
    },
    body: {
      gap: 16,
    },
    footer: {
      marginTop: 24,
      flexDirection: 'row',
      gap: 12,
    },
  });
