import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import EventCard from './EventCard';
import type { TimelineEvent } from '../../types/events';

interface EventListProps {
  events: TimelineEvent[];
  onEdit?: (eventId: string) => void;
}

export default function EventList({ events, onEdit }: EventListProps) {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          onEdit={onEdit ? () => onEdit(event.id) : undefined}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  }
});
