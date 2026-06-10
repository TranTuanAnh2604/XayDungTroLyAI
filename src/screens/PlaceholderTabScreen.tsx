import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { typography } from '../constants/typography';
import { MAIN_BOTTOM_NAV_HEIGHT } from '../constants/layout';

type PlaceholderTabScreenProps = {
  title: string;
};

export default function PlaceholderTabScreen({ title }: PlaceholderTabScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 24) + MAIN_BOTTOM_NAV_HEIGHT;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Màn hình đang được phát triển.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    ...typography.headlineMd,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyMd,
  },
});
