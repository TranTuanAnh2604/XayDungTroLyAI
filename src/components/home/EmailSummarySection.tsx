import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import EmailSummaryCard from './EmailSummaryCard';
import SectionHeader from './SectionHeader';
import type { EmailSummary } from '../../types/home';

type EmailSummarySectionProps = {
  items: EmailSummary[];
  onSeeAll?: () => void;
};

export default function EmailSummarySection({
  items,
  onSeeAll,
}: EmailSummarySectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Tóm tắt email dự án"
        actionLabel="Xem tất cả"
        onActionPress={onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <EmailSummaryCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  scroll: {
    gap: 16,
    paddingBottom: 8,
  },
});
