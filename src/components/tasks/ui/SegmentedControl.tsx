import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

type Option = {
  label: string;
  value: string;
};

interface SegmentedControlProps {
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export default function SegmentedControl({ options, selectedValue, onValueChange, disabled }: SegmentedControlProps) {
  const { colors: COLORS } = useTheme();
  const s = useMemo(() => createStyles(COLORS), [COLORS]);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const index = options.findIndex((opt) => opt.value === selectedValue);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: index > 0 ? index : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [index, animatedValue]);

  const widthPercent = 100 / options.length;

  return (
    <View style={s.container}>
      <Animated.View
        style={[
          s.activeBackground,
          {
            width: `${widthPercent}%`,
            left: animatedValue.interpolate({
              inputRange: [0, options.length - 1],
              outputRange: ['0%', `${100 - widthPercent}%`],
            }),
          },
        ]}
      />
      {options.map((opt, i) => {
        const isActive = selectedValue === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={s.segment}
            activeOpacity={0.7}
            onPress={() => onValueChange(opt.value)}
            disabled={disabled}
          >
            <Text style={[s.text, isActive && s.textActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: COLORS.surfaceVariant || '#F5F5F5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: 2,
    marginBottom: 12,
  },
  activeBackground: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary || '#666',
  },
  textActive: {
    color: COLORS.onPrimary || '#fff',
  },
});
