import { apiClient } from './client';

export interface CalendarEvent {
    cid: string;
    policyId: string;
    title: string;
    startDate: string;
    endDate: string;
    type: string;     // "deadline" 등
}

export interface DeleteCalendarEventResponse {
    deleted: boolean;
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    return apiClient.get<CalendarEvent[]>('/calendar/events');
}

export async function createCalendarEventFromPolicy(
    policyId: string,
): Promise<CalendarEvent> {
    return apiClient.post<CalendarEvent>(`/calendar/events/from-policy/${policyId}`);
}

export async function deleteCalendarEvent(cid: string): Promise<DeleteCalendarEventResponse> {
    return apiClient.delete<DeleteCalendarEventResponse>(`/calendar/events/${cid}`);
}