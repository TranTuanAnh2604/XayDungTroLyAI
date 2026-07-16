import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Animated, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

interface InputFieldProps extends TextInputProps {
  label: string;
  isTextArea?: boolean;
}

export default function InputField({ label, isTextArea, style, onFocus, onBlur, ...props }: InputFieldProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);

  const [isFocused, setIsFocused] = useState(false);
  const animatedBorder = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedBorder, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, animatedBorder]);

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.outline || '#ECECEC', COLORS.primary],
  });

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <Animated.View style={[s.inputWrapper, { borderColor }, isTextArea && s.textAreaWrapper]}>
        <TextInput
          style={[s.input, isTextArea && s.textAreaInput, style]}
          placeholderTextColor={COLORS.textSecondary || '#999'}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur && onBlur(e);
          }}
          multiline={isTextArea}
          textAlignVertical={isTextArea ? 'top' : 'center'}
          {...props}
        />
      </Animated.View>
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surface || '#fff',
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textAreaWrapper: {
    height: 80,
    justifyContent: 'flex-start',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  textAreaInput: {
    fontSize: 15,
    fontWeight: '400',
  },
});
