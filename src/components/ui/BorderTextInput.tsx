import { getTypography } from '../../constants/typography';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';


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
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
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
        placeholderTextColor={COLORS.textMuted}
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

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  group: {
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
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
