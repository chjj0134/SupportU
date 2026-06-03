import { apiClient } from './client';

export interface CalendarEvent {
    cid: string;
    policyId: string;
    title: string;
    startDate: string;
    endDate: string;
    type: string;        // "deadline" 등\n    org: string;         // 백엔드 기존 필드 (Policy에서 조인)\n    applyStatus: string; // 백엔드 기존 필드 (pending / 지원 완료 / 결과 대기 / 수혜 완료)
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