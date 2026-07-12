import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import EventList from '../../components/events/EventList';
import EventsFAB from '../../components/events/EventsFAB';
import EventsInsightCard from '../../components/events/EventsInsightCard';
import CreateEventModal from '../../components/events/CreateEventModal';
import EditEventModal from '../../components/events/EditEventModal';
import ConflictResolutionModal from '../../components/events/ConflictResolutionModal';
import { TabScreenLayout, TopAppBar } from '../../components/navigation';
import { useTheme } from '../../hooks/useTheme';
import {
  getBottomNavReservedHeight,
  SCROLL_BOTTOM_EXTRA,
} from '../../constants/layout';
import MonthCalendar from '../../components/events/MonthCalendar';
import SelectedDate from '../../components/events/SelectedDate';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EVENTS_INSIGHT } from '../../data/eventsMock';
import { useOpenSettings } from '../../hooks/useOpenSettings';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';



export default function EventsScreen() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const bottomChrome = getBottomNavReservedHeight(insets);
  const openSettings = useOpenSettings();
  const {
    selectedDateId,
    setSelectedDateId,
    importantDates,
    events,
    loading,
    error,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingEventId,
    setEditingEventId,
    editingEvent,
    conflictEvent,
    setConflictEvent,
    conflictingEvents,
    setConflictingEvents,
    serverConflictId,
    setServerConflictId,
    handleCreateEvent,
    handleEditEvent,
    handleDeleteEvent,
    handleDismissConflict,
    applyAiSuggestion,
  } = useCalendarEvents();

  return (
    <TabScreenLayout
      topBar={<TopAppBar onSettingsPress={openSettings} />}
      bottomExtra={SCROLL_BOTTOM_EXTRA + 56}
      footer={
        <EventsFAB
          bottomOffset={bottomChrome + 32}
          onPress={() => setIsCreateModalOpen(true)}
        />
      }
    >

      <MonthCalendar
        selectedDateId={selectedDateId}
        importantDates={importantDates}
        onSelect={setSelectedDateId}
      />

      <View style={styles.listGroup}>
        <SelectedDate selectedDateId={selectedDateId} />

      {/* <EventsInsightCard insight={EVENTS_INSIGHT} /> */}

      <CreateEventModal
        visible={isCreateModalOpen}
        defaultDateId={selectedDateId}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateEvent}
      />

      {loading ? (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{error}</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Không có sự kiện nào.</Text>
        </View>
      ) : (
        <EventList
          events={events}
          onEdit={(eventId) => {
            setEditingEventId(eventId);
            setIsEditModalOpen(true);
          }}
        />
      )}
      </View>

      <EditEventModal
        visible={isEditModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEventId(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <ConflictResolutionModal
        visible={!!conflictEvent}
        mainEvent={conflictEvent}
        conflictingEvents={conflictingEvents}
        serverConflictId={serverConflictId}
        onClose={() => {
          setConflictEvent(null);
          setConflictingEvents([]);
          setServerConflictId(null);
        }}
        onDismiss={handleDismissConflict}
        onApplySuggestion={applyAiSuggestion}
      />
    </TabScreenLayout>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
  listGroup: { width: '100%', gap: 16 },
  messageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
