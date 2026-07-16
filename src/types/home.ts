export type EmailSummary = {
  id: string;
  project: string;
  title: string;
  summary: string;
  iconColor: 'primary' | 'secondary';
};

export type HomeDailyTask = {
  id: string;
  title: string;
  meta: string;
  description?: string;
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

export type WeeklyTimeCategory = {
  id: string;
  title: string;
  subtitle: string;
  hours: number;
  color: string;
};

export type GoalProgress = {
  completedPercent: number;
  subtitle: string;
  detail: string;
};
