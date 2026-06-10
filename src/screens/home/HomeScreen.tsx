import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
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
