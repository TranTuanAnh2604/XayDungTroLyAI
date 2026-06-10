import React from 'react';
import { StyleSheet, View } from 'react-native';
import TimelineEventItem from './TimelineEventItem';
import { COLORS } from '../../constants/theme';
import type { TimelineEvent } from '../../types/events';

type EventTimelineProps = {
  events: TimelineEvent[];
};

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {events.map((event, index) => (
        <TimelineEventItem
          key={event.id}
          event={event}
          index={index}
          isLast={index === events.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingLeft: 0,
  },
  line: {
    position: 'absolute',
    left: 19,
    top: 16,
    bottom: 16,
    width: 1,
    backgroundColor: `${COLORS.outlineVariant}4D`,
  },
});
