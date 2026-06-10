import type { AppTabId } from '../types/navigation';

export const APP_TABS: {
  id: AppTabId;
  label: string;
  icon: 'home' | 'chat-bubble' | 'check-circle' | 'calendar-today' | 'mail';
}[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'chat', label: 'Chat', icon: 'chat-bubble' },
  { id: 'tasks', label: 'Tasks', icon: 'check-circle' },
  { id: 'calendar', label: 'Events', icon: 'calendar-today' },
  { id: 'mail', label: 'Mail', icon: 'mail' },
];
