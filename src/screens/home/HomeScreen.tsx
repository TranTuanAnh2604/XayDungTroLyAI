import React, { useEffect, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
} from 'react-native';

import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
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
  HOME_USER,
  UPCOMING_MEETING,
} from '../../data/homeMock';
import { COLORS } from '../../constants/theme';
import { typography } from '../../constants/typography';
import type { TaskItem } from '../../types/home';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { syncCalendars, syncContacts } from '../../services/auth';

export default function HomeScreen() {
  useEffect(() => {
    getContacts();
    getCalendarEvents();
  }, []);

  const insets = useSafeAreaInsets();

  const openSettings = useOpenSettings();

  const getContacts = async () => {
    const { status } =
      await Contacts.getPermissionsAsync();

    if (status !== 'granted') {
      const result =
        await Contacts.requestPermissionsAsync();

      if (result.status !== 'granted') {
        Alert.alert(
          'Thông báo',
          'Ứng dụng cần quyền danh bạ để hoạt động.'
        );
        return false;
      }
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.PhoneNumbers,
      ],
    });

    const normalizeName = (name: string) =>
      name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // bỏ dấu

    const normalizePhone = (phone: string) =>
      phone.replace(/\D/g, '').replace(/^84/, '0');
    const contactsPayload = data
        .filter((c) => c.phoneNumbers?.length)
        .map((c) => {
          const name = (c.name ?? '').trim();
          const rawPhone = c.phoneNumbers?.[0]?.number ?? '';
          const phone = normalizePhone(rawPhone);

          return {
            name,
            phone,
            fingerprint: `${normalizeName(name)}_${phone}`,
          };
        });
    const mergedContacts = Object.values(
      contactsPayload.reduce((acc, curr) => {
        if (!curr.phone) return acc;

        if (!acc[curr.fingerprint]) {
          acc[curr.fingerprint] = curr;
        }

        return acc;
      }, {} as Record<string, typeof contactsPayload[0]>)
    );

    console.log(
      'Contacts Payload:',
      JSON.stringify(mergedContacts, null, 2),
    );

    try {
      const result = await syncContacts(
        mergedContacts,
      );

      console.log('Sync Result:', result);
    } catch (error) {
      console.error('Sync Contacts Error:', error);

      Alert.alert(
        'Lỗi',
        'Không thể đồng bộ danh bạ',
      );
    }
  };


const getCalendarEvents = async () => {
  try {
  const { status } =
  await Calendar.requestCalendarPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Thông báo',
      'Ứng dụng cần quyền truy cập lịch để hoạt động.'
    );
    return;
  }

  const calendars =
    await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );

  const calendarsToSync = calendars.filter(
    (cal) =>
      cal.isVisible &&
      (
        cal.accessLevel === 'owner' ||
        cal.allowsModifications === true
      )
  );

  const start = new Date('2026-01-01');
  const end = new Date('2027-01-01');

  let allEvents: any[] = [];

  for (const cal of calendarsToSync) {
    try {
      const events =
        await Calendar.getEventsAsync(
          [cal.id],
          start,
          end
        );

      console.log(
        "📅 ${cal.title}: ${events.length} events"
      );

      const mappedEvents = events.map((e) => {
        const startTime = new Date(e.startDate).toISOString();
        const endTime = new Date(e.endDate).toISOString();

        return {
          title: e.title ?? '',
          description: e.notes ?? '',
          startTime,
          endTime,
          location: e.location ?? '',
          source: cal.source?.name ?? 'device',

          externalId: `${cal.id}_${e.id}`, // FIX TRÙNG ID

          fingerprint: `${(e.title ?? '').trim()}_${startTime}_${endTime}_${(e.location ?? '').trim()}`,

          isAllDay: e.allDay ?? false,
        };
      });

      allEvents.push(...mappedEvents);

    } catch (calendarError) {
      console.log(
        "❌ Error reading ${cal.title}:",
        calendarError
      );
    }
  }

  console.log(
    '📅 Total events synced:',
    allEvents.length
  );

  console.log(
    '📅 Calendar payload:',
    JSON.stringify(allEvents, null, 2)
  );

  if (allEvents.length === 0) {
    Alert.alert(
      'Thông báo',
      'Không tìm thấy sự kiện nào để đồng bộ'
    );
    return;
  }

  const result =
    await syncCalendars(allEvents);

  console.log(
    '📡 Sync result:',
    result
  );

  // Alert.alert(
  //   "Thành công",
  //   `Đã đồng bộ ${allEvents.length} sự kiện`
  // );

  } catch (error) {
  console.log(
  '❌ Calendar Sync Error:',
  error
  );


  Alert.alert(
    'Lỗi',
    'Không thể đồng bộ lịch'
  );


  }
};



  const [tasks, setTasks] = useState<TaskItem[]>(DAILY_TASKS);
  const bottomChrome = getBottomNavReservedHeight(insets);

  const handleToggleTask = useCallback((id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );
  }, []);

  return (
    <TabScreenLayout
      topBar={
        <TopAppBar onSettingsPress={openSettings} />
      }
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      footer={<HomeFAB bottomOffset={bottomChrome + 16} />}
    >
    
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          {HOME_USER.greeting}, {HOME_USER.name}.
        </Text>
        <Text style={styles.greetingSubtitle}>{HOME_USER.subtitle}</Text>
      </View>

      <DaySummaryCard summary={DAY_SUMMARY} />

      <EmailSummarySection items={EMAIL_SUMMARIES} />

      <UpcomingMeetingCard meeting={UPCOMING_MEETING} />

      <TaskListSection tasks={tasks} onToggleTask={handleToggleTask} />
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
