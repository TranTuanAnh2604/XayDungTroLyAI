import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ComposeFAB, { useComposeFabScroll } from '../../components/mail/ComposeFAB';
import MailAiSummaryCard from '../../components/mail/MailAiSummaryCard';
import MailCategorySection from '../../components/mail/MailCategorySection';
import MailFilterBar from '../../components/mail/MailFilterBar';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import {
  MAIL_AI_SUMMARY,
  MAIL_CATEGORIES,
  MAIL_FILTERS,
} from '../../data/mailMock';
import type { MailFilterId } from '../../types/mail';
import { useOpenSettings } from '../../hooks/useOpenSettings';

export default function MailScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [activeFilter, setActiveFilter] = useState<MailFilterId>('all');
  const fabAnim = useComposeFabScroll();
  const bottomChrome = getBottomNavReservedHeight(insets);

  const filteredCategories = useMemo(() => {
    if (activeFilter === 'all') return MAIL_CATEGORIES;

    return MAIL_CATEGORIES.map((cat) => ({
      ...cat,
      emails: cat.emails.filter((email) => {
        if (activeFilter === 'unread') {
          return email.time.includes(':') || email.time === 'Hôm qua';
        }
        if (activeFilter === 'recent') {
          return (
            email.time.includes(':') ||
            email.time === 'Hôm qua' ||
            email.time === '08:30'
          );
        }
        if (activeFilter === 'important') {
          return (
            cat.tone === 'primary' ||
            email.sender.includes('Alpha') ||
            email.sender.includes('Techcombank')
          );
        }
        return true;
      }),
    })).filter((cat) => cat.emails.length > 0);
  }, [activeFilter]);

  return (
    <TabScreenLayout
      topBar={
        <TopAppBar onSettingsPress={openSettings} />
      }
      bottomExtra={SCROLL_BOTTOM_EXTRA + 48}
      scrollViewProps={{
        onScroll: fabAnim.onScroll,
        scrollEventThrottle: 16,
      }}
      footer={
        <ComposeFAB
          bottomOffset={bottomChrome + 32}
          translateY={fabAnim.translateY}
          scale={fabAnim.scale}
          spin={fabAnim.spin}
          opacity={fabAnim.opacity}
        />
      }
    >
      <MailFilterBar
        filters={MAIL_FILTERS}
        activeId={activeFilter}
        onChange={setActiveFilter}
      />

      <MailAiSummaryCard summary={MAIL_AI_SUMMARY} />

      {filteredCategories.map((category) => (
        <MailCategorySection key={category.id} category={category} />
      ))}
    </TabScreenLayout>
  );
}
