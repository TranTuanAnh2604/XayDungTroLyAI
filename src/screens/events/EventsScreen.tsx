import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateSelectorStrip from '../../components/events/DateSelectorStrip';
import EventTimeline from '../../components/events/EventTimeline';
import EventsFAB from '../../components/events/EventsFAB';
import EventsInsightCard from '../../components/events/EventsInsightCard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import {
  CALENDAR_DATES,
  DEFAULT_SELECTED_DATE_ID,
  EVENTS_BRAND,
  EVENTS_INSIGHT,
  TIMELINE_EVENTS,
} from '../../data/eventsMock';
import { useOpenSettings } from '../../hooks/useOpenSettings';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [selectedDateId, setSelectedDateId] =
    useState(DEFAULT_SELECTED_DATE_ID);
  const bottomChrome = getBottomNavReservedHeight(insets);

  return (
    <TabScreenLayout
      topBar={
        <TopAppBar onSettingsPress={openSettings} />
      }
      bottomExtra={SCROLL_BOTTOM_EXTRA + 56}
      footer={<EventsFAB bottomOffset={bottomChrome + 32} />}
    >
      <DateSelectorStrip
        monthLabel={EVENTS_BRAND.monthLabel}
        todayLabel={EVENTS_BRAND.todayLabel}
        dates={CALENDAR_DATES}
        selectedId={selectedDateId}
        onSelect={setSelectedDateId}
      />

      <EventsInsightCard insight={EVENTS_INSIGHT} />

      <EventTimeline events={TIMELINE_EVENTS} />
    </TabScreenLayout>
  );
}
