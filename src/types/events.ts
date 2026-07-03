import type { MaterialIconName } from './common';

export type CalendarDateItem = {
  id: string;
  weekday: string;
  day: number;
};

export type EventsInsight = {
  title: string;
  body: string;
  highlight: string;
  primaryAction: string;
  secondaryAction: string;
};

type TimelineEventBase = {
  id: string;
  date?: string;
  time: string;
  expandedDetail?: string;
};

export type UrgentTimelineEvent = TimelineEventBase & {
  type: 'urgent';
  title: string;
  description: string;
  badge: string;
  avatars: string[];
};

export type MeetingTimelineEvent = TimelineEventBase & {
  type: 'meeting';
  title: string;
  description: string;
  badge: string;
  joinLabel: string;
};

export type BreakTimelineEvent = TimelineEventBase & {
  type: 'break';
  title: string;
};

export type TaskTimelineEvent = TimelineEventBase & {
  type: 'task';
  title: string;
  tags: string[];
};

export type TimelineEvent =
  | UrgentTimelineEvent
  | MeetingTimelineEvent
  | BreakTimelineEvent
  | TaskTimelineEvent;
