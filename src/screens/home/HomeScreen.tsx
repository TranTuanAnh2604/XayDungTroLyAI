import { getTypography } from '../../constants/typography';
import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import { HOME_USER } from '../../data/homeMock';
import GoalProgressCard from '../../components/home/GoalProgressCard';
import WeeklyTimeStatsCard from '../../components/home/WeeklyTimeStatsCard';
import ProductivityScoreCard from '../../components/home/ProductivityScoreCard';
import AiInsightsCard from '../../components/home/AiInsightsCard';
import ProductivityTrendCard from '../../components/home/ProductivityTrendCard';
import { useTheme } from '../../hooks/useTheme';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { useProductivityDashboard } from '../../hooks/useProductivityDashboard';
import { useProfile } from '../../hooks/useProfile';
import {
  fetchDeviceCalendarEvents,
  requestCalendarPermission,
} from '../../services/calendar';
import {
  fetchDeviceContacts,
  requestContactsPermission,
} from '../../services/contacts';
import {
  syncCalendars,
  syncContacts,
  markDeviceDataSyncedThisSession,
  shouldSyncDeviceDataThisSession,
  consumePendingServerSyncEvents,
} from '../../services/sync';
import type { WeeklyTimeCategory, GoalProgress } from '../../types/home';
import type { ProductivityReport } from '../../types/productivity';

function deriveWeeklyCategories(report: ProductivityReport): WeeklyTimeCategory[] {
  return [
    {
      id: 'tasks',
      title: 'Nhiệm vụ',
      subtitle: `${report.tasksCompleted ?? 0} hoàn thành`,
      hours: Number((report.focusTimeHours ?? 0).toFixed(1)),
      color: '#7C4DFF',
    },
    {
      id: 'events',
      title: 'Sự kiện',
      subtitle: `${report.eventsCompleted ?? 0} tham gia`,
      hours: Number(((report.focusTimeHours ?? 0) * 0.3).toFixed(1)), // estimate if not available
      color: '#00BFA6',
    },
    {
      id: 'break',
      title: 'Nghỉ ngơi',
      subtitle: 'Thời gian nghỉ',
      hours: Number((report.breakTimeHours ?? 0).toFixed(1)),
      color: '#FFB300',
    },
  ];
}

function deriveGoalProgress(report: ProductivityReport): GoalProgress {
  return {
    completedPercent: report.taskCompletionRate ?? 0,
    subtitle: 'Hoàn thành mục tiêu tuần',
    detail:
      report.overallEvaluation ||
      `Hoàn thành ${Math.round(report.taskCompletionRate ?? 0)}% nhiệm vụ tuần này.`,
  };
}

export default function HomeScreen() {
  const { colors: COLORS } = useTheme();
  const typography = React.useMemo(() => getTypography(COLORS), [COLORS]);
  const styles = React.useMemo(() => createStyles(COLORS, typography), [COLORS]);
  const insets = useSafeAreaInsets();
  const openSettings = useOpenSettings();
  const { profile } = useProfile();

  const hour = new Date().getHours();
  let dynamicGreeting = 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) {
    dynamicGreeting = 'Chào buổi chiều';
  } else if (hour >= 18 || hour < 5) {
    dynamicGreeting = 'Chào buổi tối';
  }
  const displayName = profile?.name || HOME_USER.name;

  const {
    latestReport,
    trend,
    isLoading,
    isGenerating,
    error,
    refresh,
    generateReport,
  } = useProductivityDashboard();

  const weeklyCategories: WeeklyTimeCategory[] = latestReport
    ? deriveWeeklyCategories(latestReport)
    : [];
  const goalProgress: GoalProgress | null = latestReport
    ? deriveGoalProgress(latestReport)
    : null;

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
      Alert.alert('Thông báo', 'Ứng dụng cần quyền danh bạ để hoạt động.');
      return;
    }
    try {
      const contacts = await fetchDeviceContacts();
      if (contacts.length === 0) return;
      const result = await syncContacts(contacts);
      console.log('Sync Contacts Result:', result);
    } catch (err) {
      console.error('Sync Contacts Error:', err);
    }
  };

  const handleCalendarSync = async () => {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      Alert.alert('Thông báo', 'Ứng dụng cần quyền truy cập lịch để hoạt động.');
      return;
    }
    try {
      const events = await fetchDeviceCalendarEvents();
      if (events.length === 0) return;
      const eventsToSync = await consumePendingServerSyncEvents(events);
      if (eventsToSync.length === 0) return;
      const result = await syncCalendars(eventsToSync);
      console.log('Sync Calendar Result:', result);
    } catch (err) {
      console.error('Calendar Sync Error:', err);
    }
  };

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleGenerate = useCallback(async () => {
    await generateReport();
  }, [generateReport]);

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 32}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ),
      }}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>
          {dynamicGreeting}, {displayName}.
        </Text>
        <Text style={styles.greetingSubtitle}>{HOME_USER.subtitle}</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRefresh} hitSlop={8}>
            <Text style={styles.errorRetry}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      {latestReport || isLoading ? (
        <View style={styles.dashboardGroup}>
          <ProductivityScoreCard report={latestReport} skeleton={isLoading && !latestReport} />
          <WeeklyTimeStatsCard
            categories={weeklyCategories}
            skeleton={isLoading && !latestReport}
          />
          {goalProgress || isLoading ? (
            <GoalProgressCard
              progress={goalProgress ?? { completedPercent: 0, subtitle: '', detail: '' }}
              skeleton={isLoading && !latestReport}
            />
          ) : null}
          <AiInsightsCard report={latestReport} skeleton={isLoading && !latestReport} />
        </View>
      ) : null}

      {trend.length > 0 || isLoading ? (
        <ProductivityTrendCard trend={trend} skeleton={isLoading && trend.length === 0} />
      ) : null}


    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  greeting: {},
  dashboardGroup: {
    gap: 16,
  },
  greetingTitle: {
    ...typography.displayLgMobile,
    color: COLORS.onBackground,
  },
  greetingSubtitle: {
    ...typography.bodyMd,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.errorTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    ...typography.bodyMd,
    color: COLORS.danger,
    flex: 1,
    marginRight: 8,
  },
  errorRetry: {
    ...typography.bodyMd,
    color: COLORS.danger,
    fontWeight: '700',
  },
  generateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  generateHint: {
    ...typography.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    ...typography.bodyMd,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
});
