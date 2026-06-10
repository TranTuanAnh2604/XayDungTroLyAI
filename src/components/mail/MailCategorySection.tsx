import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MailListItem from './MailListItem';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { MailCategory, MailCategoryTone } from '../../types/mail';

type MailCategorySectionProps = {
  category: MailCategory;
  onEmailPress?: (emailId: string) => void;
};

function barColor(tone: MailCategoryTone) {
  switch (tone) {
    case 'emerald':
      return COLORS.emerald;
    case 'secondary':
      return COLORS.secondary;
    default:
      return COLORS.primary;
  }
}

export default function MailCategorySection({
  category,
  onEmailPress,
}: MailCategorySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.bar, { backgroundColor: barColor(category.tone) }]} />
        <Text style={styles.title}>{category.title}</Text>
      </View>
      {category.emails.map((email) => (
        <MailListItem
          key={email.id}
          email={email}
          onPress={() => onEmailPress?.(email.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  bar: {
    width: 6,
    height: 16,
    borderRadius: 3,
  },
  title: {
    ...typography.labelCaps,
    letterSpacing: 1.5,
  },
});
