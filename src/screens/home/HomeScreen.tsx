import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DaySummaryCard from '../../components/home/DaySummaryCard';
import EmailSummarySection from '../../components/home/EmailSummarySection';
import HomeFAB from '../../components/home/HomeFAB';
import TaskListSection from '../../components/home/TaskListSection';
import UpcomingMeetingCard from '../../components/home/UpcomingMeetingCard';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import {
  DAY_SUMMARY,
  DAILY_TASKS,
  EMAIL_SUMMARIES,
  GOAL_PROGRESS,
  HOME_USER,
  UPCOMING_MEETING,
  WEEKLY_TIME_CATEGORIES,
} from '../../data/homeMock';
import GoalProgressCard from '../../components/home/GoalProgressCard';
import WeeklyTimeStatsCard from '../../components/home/WeeklyTimeStatsCard';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { HomeDailyTask } from '../../types/home';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import {
  fetchDeviceCalendarEvents,
  requestCalendarPermission,
} from '../../services/calendar';
import {
  fetchDeviceContacts,
  requestContactsPermission,
} from '../../services/contacts';
import {
  syncCalendarsAndResolveConflicts,
  syncContacts,
  markDeviceDataSyncedThisSession,
  shouldSyncDeviceDataThisSession,
  consumePendingServerSyncEvents,
} from '../../services/sync';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const [tasks, setTasks] = useState<HomeDailyTask[]>(DAILY_TASKS);

  useEffect(() => {
    async function initializeSync() {
      await handleContactSync();
      await handleCalendarSync();
    }

    if (!shouldSyncDeviceDataThisSession()) {
      return;
    }

    markDeviceDataSyncedThisSession();
    initializeSync();
  }, []);

  const handleContactSync = async () => {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      Alert.alert(
        'Thông báo',
        'Ứng dụng cần quyền danh bạ để hoạt động.',
      );
      return;
    }

    try {
      const contacts = await fetchDeviceContacts();
      if (contacts.length === 0) {
        return;
      }

      const result = await syncContacts(contacts);
      console.log('Sync Contacts Result:', result);
    } catch (error) {
      console.error('Sync Contacts Error:', error);
      Alert.alert('Lỗi', 'Không thể đồng bộ danh bạ');
    }
  };

  const handleCalendarSync = async () => {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      Alert.alert(
        'Thông báo',
        'Ứng dụng cần quyền truy cập lịch để hoạt động.',
      );
      return;
    }

    try {
      const events = await fetchDeviceCalendarEvents();
      if (events.length === 0) {
        Alert.alert(
          'Thông báo',
          'Không tìm thấy sự kiện nào để đồng bộ',
        );
        return;
      }

      const eventsToSync = await consumePendingServerSyncEvents(events);
      if (eventsToSync.length === 0) {
        console.log('No new device calendar events to sync.');
        return;
      }

      const result = await syncCalendarsAndResolveConflicts(eventsToSync);
      console.log('Sync Calendar Result:', result);
    } catch (error) {
      console.error('Calendar Sync Error:', error);
      Alert.alert('Lỗi', 'Không thể đồng bộ lịch');
    }
  };

  const bottomChrome = getBottomNavReservedHeight(insets);

  const handleToggleTask = useCallback((id: string, completed: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
  }, []);

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      // footer={<HomeFAB bottomOffset={bottomChrome + 16} />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          {HOME_USER.greeting}, {HOME_USER.name}.
        </Text>
        <Text style={styles.greetingSubtitle}>{HOME_USER.subtitle}</Text>
      </View>

      <WeeklyTimeStatsCard categories={WEEKLY_TIME_CATEGORIES} />

      <GoalProgressCard progress={GOAL_PROGRESS} />

    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  greeting: {},
  greetingTitle: {
    ...typography.displayLgMobile,
    color: COLORS.onBackground,
  },
  greetingSubtitle: {
    ...typography.bodyMd,
    marginTop: 4,
  },
});
