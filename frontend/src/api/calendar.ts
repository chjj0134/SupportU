import { apiClient } from './client';

export interface CalendarEvent {
    cid: string | number;
    policyId: string;
    title: string;
    eventStartAt: string;
    eventEndAt: string;
    org: string;
    applyStatus: string;
}

export interface DeleteCalendarEventResponse {
    deleted: boolean;
}

export type CalendarApplyStatus = 'pending' | 'apply_now' | 'applied' | 'benefited';

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    return apiClient.get<CalendarEvent[]>('/calendar/events');
}

export async function createCalendarEventFromPolicy(
    policyId: string,
): Promise<CalendarEvent> {
    return apiClient.post<CalendarEvent>(`/calendar/events/from-policy/${policyId}`);
}

export async function updateCalendarEventStatus(
    cid: string | number,
    applyStatus: CalendarApplyStatus,
): Promise<CalendarEvent> {
    return apiClient.put<CalendarEvent>(`/calendar/events/${cid}/status`, { applyStatus });
}

export async function deleteCalendarEvent(cid: string | number): Promise<DeleteCalendarEventResponse> {
    return apiClient.delete<DeleteCalendarEventResponse>(`/calendar/events/${cid}`);
}
