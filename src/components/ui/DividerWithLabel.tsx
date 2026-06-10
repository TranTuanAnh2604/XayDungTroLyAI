import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type DividerWithLabelProps = {
  label?: string;
  variant?: 'badge' | 'lines';
};

export default function DividerWithLabel({
  label = 'Hoặc',
  variant = 'badge',
}: DividerWithLabelProps) {
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

const styles = StyleSheet.create({
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
