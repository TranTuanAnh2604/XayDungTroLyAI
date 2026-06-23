import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
  StyleProp,
  Text,
  Pressable,
} from 'react-native';

type OTPInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const OTP_LENGTH = 6;

export default function OTPInput({
  value,
  onChangeText,
  length = OTP_LENGTH,
  disabled = false,
  style,
}: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = (text: string) => {
    try {
      console.log('🔢 OTP Input:', text);
      
      // Filter only numbers
      let numericText = '';
      for (let i = 0; i < text.length && i < length; i++) {
        if (text[i] >= '0' && text[i] <= '9') {
          numericText += text[i];
        }
      }
      
      console.log('🔢 OTP Result:', numericText);
      onChangeText(numericText);
    } catch (error) {
      console.error('❌ OTP Error:', error);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const digits = value.split('');
  const digitsArray = Array.from({ length }, (_, i) => digits[i] || '');

  return (
    <Pressable onPress={handlePress} style={style}>
      {/* Hidden TextInput for keyboard capture */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="decimal-pad"
        editable={!disabled}
        testID="otp-input"
      />
      
      {/* Visible OTP boxes */}
      <View style={styles.digitsContainer}>
        {digitsArray.map((digit, index) => (
          <View
            key={`digit-${index}`}
            style={[
              styles.digitBox,
              {
                borderColor:
                  value.length >= index + 1
                    ? '#3525cd'
                    : '#cad2e2',
              },
            ]}
          >
            <Text style={styles.digitText}>{digit}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 8,
  },
  digitBox: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f3ff',
  },
  digitText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#131b2e',
  },
});
