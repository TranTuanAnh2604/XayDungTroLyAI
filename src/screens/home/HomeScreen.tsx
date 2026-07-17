import { getTypography } from '../../constants/typography';
import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const cardWidth = Math.min(windowWidth - 32, 512); // clamp to max content width if on tablet
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import {
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import { HOME_USER } from '../../data/homeMock';
import WeeklyTimeStatsCard from '../../components/home/WeeklyTimeStatsCard';
import ProductivityScoreCard from '../../components/home/ProductivityScoreCard';
import ProductivityTrendCard from '../../components/home/ProductivityTrendCard';
import AppGlassCard from '../../components/ui/AppGlassCard';
import { useTheme } from '../../hooks/useTheme';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { useProductivityDashboard } from '../../hooks/useProductivityDashboard';
import { useTasksList } from '../../hooks/useTasksList';
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
  const navigation = useNavigation<any>();
  const { tasks, todos, fetchData } = useTasksList();

  const [activeCardIndex, setActiveCardIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const hour = new Date().getHours();
  let dynamicGreeting = 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) {
    dynamicGreeting = 'Chào buổi chiều';
  } else if (hour >= 18 || hour < 5) {
    dynamicGreeting = 'Chào buổi tối';
  }
  const displayName = profile?.name || HOME_USER.name;

  const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  const pendingTodos = todos.filter(t => !t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalPending = pendingTodos + pendingTasks;
  const dynamicSummary = totalPending > 0 ? `Bạn có ${totalPending} công việc chưa hoàn thành.` : 'Bạn không có việc nào chưa hoàn thành.';

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
    fetchData(true);
    await refresh();
  }, [refresh, fetchData]);

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
      <View style={styles.topSection}>
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>
            {dynamicGreeting}, {displayName}.
          </Text>
          <Text style={styles.greetingDate}>{todayStr}</Text>
          <Text style={styles.greetingSubtitle}>{dynamicSummary}</Text>
        </View>

        {totalPending > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.agendaSection}>
              <View style={styles.agendaHeader}>
                <Text style={styles.agendaTitle}>Việc chưa hoàn thành</Text>
                <Pressable onPress={() => navigation.navigate('Main', { tab: 'tasks' })}>
                  <Text style={styles.agendaViewAll}>Xem tất cả</Text>
                </Pressable>
              </View>
              {(() => {
                const now = new Date().getTime();
                const pendingItems = [...todos.filter(t => !t.completed), ...tasks.filter(t => !t.completed)].sort((a, b) => {
                  const hasDueA = !!a.dueDate;
                  const hasDueB = !!b.dueDate;

                  if (!hasDueA && !hasDueB) return 0;
                  if (!hasDueA) return 1;
                  if (!hasDueB) return -1;

                  const dueA = new Date(a.dueDate!).getTime();
                  const dueB = new Date(b.dueDate!).getTime();

                  if (isNaN(dueA) && isNaN(dueB)) return 0;
                  if (isNaN(dueA)) return 1;
                  if (isNaN(dueB)) return -1;

                  const todayMidnight = new Date();
                  todayMidnight.setHours(0, 0, 0, 0);
                  const todayTime = todayMidnight.getTime();

                  const getMidnight = (time: number) => {
                    const d = new Date(time);
                    d.setHours(0, 0, 0, 0);
                    return d.getTime();
                  };

                  const isOverdueA = getMidnight(dueA) < todayTime;
                  const isOverdueB = getMidnight(dueB) < todayTime;

                  if (!isOverdueA && isOverdueB) return -1;
                  if (isOverdueA && !isOverdueB) return 1;

                  return dueA - dueB;
                });

                const displayItems = pendingItems.slice(0, 3);
                const hasMore = pendingItems.length > 3;

                return (
                  <>
                    {displayItems.map((item, idx) => (
                      <AppGlassCard key={item.id || idx} variant="surface" padding={12} style={styles.agendaCard}>
                        <View style={styles.agendaRow}>
                          <MaterialIcons
                            name="radio-button-unchecked"
                            size={20}
                            color={item.priority === 'high' ? COLORS.error : COLORS.primary}
                          />
                          <View style={styles.agendaContent}>
                            <Text style={styles.agendaItemTitle} numberOfLines={1}>{item.title}</Text>
                            {!!item.description && (
                              <Text style={styles.agendaItemMeta} numberOfLines={1}>{item.description}</Text>
                            )}
                          </View>
                        </View>
                      </AppGlassCard>
                    ))}
                    {hasMore && (
                      <View style={styles.moreIndicator}>
                        <MaterialIcons name="more-horiz" size={24} color={COLORS.textSecondary} />
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          </>
        )}
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

          <View style={{ position: 'relative' }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={cardWidth + 24}
              decelerationRate="fast"
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / (cardWidth + 24));
                if (index !== activeCardIndex) setActiveCardIndex(index);
              }}
              scrollEventThrottle={16}
            >
              <View style={{ width: cardWidth, height: 240, position: 'relative' }}>
                <WeeklyTimeStatsCard
                  categories={weeklyCategories}
                  skeleton={isLoading && !latestReport}
                />
                <Pressable
                  style={[styles.arrowBtnInScrollView, { right: -24 }]}
                  onPress={() => scrollRef.current?.scrollTo({ x: activeCardIndex === 0 ? cardWidth + 24 : 0, animated: true })}
                >
                  <MaterialIcons
                    name={activeCardIndex === 0 ? "chevron-right" : "chevron-left"}
                    size={24}
                    color={COLORS.onSurfaceVariant}
                  />
                </Pressable>
              </View>
              <View style={{ width: cardWidth, height: 240, position: 'relative' }}>
                {trend.length > 0 || isLoading ? (
                  <ProductivityTrendCard trend={trend} skeleton={isLoading && trend.length === 0} />
                ) : (
                  <AppGlassCard variant="surface" padding={16} style={{ flex: 1 }}>
                    <Text style={{ ...typography.bodyMd, color: COLORS.textSecondary, fontStyle: 'italic' }}>Chưa có dữ liệu xu hướng hiệu suất</Text>
                  </AppGlassCard>
                )}
              </View>
            </ScrollView>
          </View>


        </View>
      ) : null}


    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any, typography: any) => StyleSheet.create({
  topSection: {
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    width: '100%',
  },
  greeting: {
  },
  dashboardGroup: {
    gap: 12,
  },
  greetingTitle: {
    ...typography.displayLgMobile,
    color: COLORS.onBackground,
  },
  greetingDate: {
    ...typography.labelCaps,
    color: COLORS.primary,
    marginTop: 4,
  },
  greetingSubtitle: {
    ...typography.bodyMd,
    marginTop: 4,
  },

  agendaSection: {
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agendaTitle: {
    ...typography.headlineSm,
    color: COLORS.onBackground,
  },
  agendaViewAll: {
    ...typography.bodyMd,
    color: COLORS.primary,
    fontWeight: '600',
  },
  agendaCard: {
    marginBottom: 8,
  },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agendaContent: {
    flex: 1,
  },
  agendaItemTitle: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  agendaItemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  moreIndicator: {
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyText: {
    ...typography.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  arrowBtnInScrollView: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
