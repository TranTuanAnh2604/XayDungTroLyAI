import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';

type TranscriptionDisplayProps = {
  phrases: string[];
  processingHint: string;
  intervalMs?: number;
};

export default function TranscriptionDisplay({
  phrases,
  processingHint,
  intervalMs = 6000,
}: TranscriptionDisplayProps) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex((i) => (i + 1) % phrases.length);
        translateY.setValue(-8);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, opacity, phrases.length, translateY]);

  return (
    <View style={styles.container}>
      <View style={styles.textArea}>
        <Animated.Text
          style={[
            styles.transcription,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          "{phrases[index]}"
        </Animated.Text>
        <Text style={styles.hint}>{processingHint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcription: {
    ...typography.displayLgMobile,
    textAlign: 'center',
    lineHeight: 40,
    opacity: 0.9,
  },
  hint: {
    ...typography.bodyMd,
    color: COLORS.outline,
    marginTop: 16,
    textAlign: 'center',
  },
});
