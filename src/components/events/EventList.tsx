import React from 'react';
import { View, StyleSheet } from 'react-native';
import EventCard from './EventCard';
import type { TimelineEvent } from '../../types/events';

interface EventListProps {
  events: TimelineEvent[];
  onEdit?: (eventId: string) => void;
}

export default function EventList({ events, onEdit }: EventListProps) {
  return (
    <View style={styles.contentContainer}>
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          onEdit={onEdit ? () => onEdit(event.id) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  }
});
