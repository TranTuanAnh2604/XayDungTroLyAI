import { getTypography } from '../../constants/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';


type DividerWithLabelProps = {
  label?: string;
  variant?: 'badge' | 'lines';
};

export default function DividerWithLabel({
  label = 'Hoặc',
  variant = 'badge',
}: DividerWithLabelProps) {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  if (variant === 'lines') {
    return (
      <View style={styles.linesContainer}>
        <View style={styles.linesRule} />
        <Text style={styles.linesText}>{label}</Text>
        <View style={styles.linesRule} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.badge}>
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  container: {
    marginVertical: 32,
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
    top: '50%',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(250, 248, 255, 0.5)',
  },
  text: {
    ...typography.labelCaps,
  },
  linesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  linesRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${COLORS.outlineVariant}4D`,
  },
  linesText: {
    ...typography.labelCaps,
    color: COLORS.outlineVariant,
    marginHorizontal: 16,
  },
});
