import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type UnderlineTextInputProps = TextInputProps & {
  label: string;
  labelRight?: React.ReactNode;
};

export default function UnderlineTextInput({
  label,
  labelRight,
  value,
  onFocus,
  onBlur,
  ...rest
}: UnderlineTextInputProps) {
  const [focused, setFocused] = useState(false);
  const borderWidth = useRef(new Animated.Value(0)).current;

  const animateBorder = (toFocused: boolean) => {
    Animated.timing(borderWidth, {
      toValue: toFocused || Boolean(value) ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (value) {
      animateBorder(true);
    }
  }, [value]);

  const animatedWidth = borderWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <TextInput
        {...rest}
        value={value}
        style={styles.input}
        placeholderTextColor={`${COLORS.outlineVariant}80`}
        onFocus={(e) => {
          setFocused(true);
          animateBorder(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          animateBorder(false);
          onBlur?.(e);
        }}
      />
      <View style={styles.underlineTrack}>
        <Animated.View
          style={[
            styles.underlineActive,
            { width: animatedWidth, opacity: focused || value ? 1 : 0.8 },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  label: {
    ...typography.labelCaps,
  },
  input: {
    ...typography.bodyLg,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  underlineTrack: {
    height: 2,
    marginTop: -2,
    alignItems: 'center',
    overflow: 'hidden',
  },
  underlineActive: {
    height: 2,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
  },
});
