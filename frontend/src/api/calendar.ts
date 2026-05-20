import { apiClient } from './client';

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

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    return apiClient.get<CalendarEvent[]>('/calendar/events');
}

export async function createCalendarEventFromPolicy(
    policyId: string,
): Promise<CalendarEvent> {
    return apiClient.post<CalendarEvent>(`/calendar/events/from-policy/${policyId}`);
}

export async function deleteCalendarEvent(cid: number): Promise<void> {
    await apiClient.delete(`/calendar/events/${cid}`);
}