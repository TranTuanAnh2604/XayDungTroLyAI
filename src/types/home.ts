export type EmailSummary = {
  id: string;
  project: string;
  title: string;
  summary: string;
  iconColor: 'primary' | 'secondary';
};

export type TaskItem = {
  id: string;
  title: string;
  meta: string;
  completed?: boolean;
};

export type MeetingAttendee = {
  id: string;
  avatarUri: string;
};

export type UpcomingMeeting = {
  id: string;
  badge: string;
  title: string;
  time: string;
  attendees: MeetingAttendee[];
  extraAttendees: number;
};

export type DaySummary = {
  priorityTasks: number;
  meetings: number;
  progressStep: number;
};
