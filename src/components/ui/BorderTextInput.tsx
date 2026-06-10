import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type BorderTextInputProps = TextInputProps & {
  label: string;
  labelRight?: React.ReactNode;
};

export default function BorderTextInput({
  label,
  labelRight,
  value,
  onFocus,
  onBlur,
  style,
  ...rest
}: BorderTextInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(value);

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <TextInput
        {...rest}
        value={value}
        style={[styles.input, active && styles.inputActive, style]}
        placeholderTextColor={`${COLORS.outlineVariant}80`}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  label: {
    ...typography.labelCaps,
    paddingHorizontal: 4,
  },
  input: {
    ...typography.bodyLg,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  inputActive: {
    borderBottomColor: COLORS.primary,
  },
});
