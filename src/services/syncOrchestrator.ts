import { tasksApi } from './task';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  CalendarSyncRequest
} from './sync';

export const syncOrchestrator = {
  // --- Task -> Event ---
  async onTaskCreated(taskId: string, title: string, description?: string, dueDate?: string, isTodo: boolean = false) {
    // Backend acts as the single source of truth and auto-creates the Event.
    // Removed manual creation to prevent duplicate events.
  },

  async onTaskUpdated(taskId: string, updates: { title?: string; description?: string; dueDate?: string; completed?: boolean }, isTodo: boolean = false) {
    // Backend handles sync automatically.
  },

  async onTaskDeleted(taskId: string) {
    // Backend handles sync automatically.
  },

  // --- Event -> Task ---
  async onEventCreated(event: CalendarSyncRequest, eventId: string) {
    // Backend handles sync automatically.
  },

  async onEventUpdated(eventId: string, event: CalendarSyncRequest) {
    // Backend handles sync automatically.
  },

  async onEventDeleted(eventId: string, existingEvent: CalendarSyncRequest) {
    // Backend handles sync automatically.
    // Ensure we do not manually delete the Task here, which caused the rule violation.
  }
};
