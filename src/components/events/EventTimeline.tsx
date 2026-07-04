import React from 'react';
import { StyleSheet, View } from 'react-native';
import TimelineEventItem from './TimelineEventItem';
import { useTheme } from '../../hooks/useTheme';
import type { TimelineEvent } from '../../types/events';

type EventTimelineProps = {
  events: TimelineEvent[];
  onEdit?: (eventId: string) => void;
};

export default function EventTimeline({ events, onEdit }: EventTimelineProps) {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {events.map((event, index) => (
        <TimelineEventItem
          key={event.id}
          event={event}
          index={index}
          isLast={index === events.length - 1}
          onEdit={onEdit ? () => onEdit(event.id) : undefined}
        />
      ))}
    </View>
  );
}

const createStyles = (COLORS: any) => StyleSheet.create({
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
