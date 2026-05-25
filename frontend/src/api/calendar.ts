import { apiClient } from './client';
import { withMock } from './config';
import { MOCK_CALENDAR_EVENTS } from './__mocks__/calendar.mock';

export interface CalendarEvent {
  cid: number;
  policyId: string;
  title: string;
  org: string;
  category: string;
  applyStatus: string;
  eventStartAt: string;
  eventEndAt: string;
  reminderAt: string;
  googleEventId: string | null;
  googleEventLink: string | null;
}

export function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  return withMock(
    () => MOCK_CALENDAR_EVENTS,
    () => apiClient.get<CalendarEvent[]>('/calendar/events'),
  );
}

export function createCalendarEventFromPolicy(policyId: string): Promise<CalendarEvent> {
  return withMock(
    () => {
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return {
        cid: Date.now(),
        policyId,
        title: `정책 ${policyId} 일정`,
        org: '-',
        category: 'Jobs',
        applyStatus: 'BOOKMARKED',
        eventStartAt: deadline.toISOString(),
        eventEndAt: deadline.toISOString(),
        reminderAt: new Date(deadline.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        googleEventId: null,
        googleEventLink: null,
      };
    },
    () => apiClient.post<CalendarEvent>(`/calendar/events/from-policy/${policyId}`),
  );
}

export function deleteCalendarEvent(cid: number): Promise<void> {
  return withMock(
    () => { console.info('[mock] delete calendar event', cid); },
    () => apiClient.delete(`/calendar/events/${cid}`),
  );
}
