import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BorderTextInput from './BorderTextInput';
import { COLORS } from '../../constants/theme';
import type { TextInputProps } from 'react-native';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
};

export default function PasswordInput({
  label,
  value,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <BorderTextInput
        {...rest}
        label={label}
        value={value}
        secureTextEntry={!visible}
        style={styles.inputWithIcon}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        <MaterialIcons
          name={visible ? 'visibility-off' : 'visibility'}
          size={20}
          color={visible ? COLORS.primary : COLORS.outline}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingRight: 40,
  },
  toggle: {
    position: 'absolute',
    right: 4,
    bottom: 14,
  },
});
