import { apiClient } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

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

const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
    {
        cid: 'mock-calendar-1',
        policyId: '1',
        title: '2025 청년 월세 지원사업',
        org: '서울주택도시공사(SH)',
        applyStatus: '지원 필요',
        eventStartAt: '2026-06-08T09:00:00',
        eventEndAt: '2026-06-08T10:00:00',
    },
    {
        cid: 'mock-calendar-2',
        policyId: '2',
        title: '청년 일자리 도약 장려금',
        org: '고용노동부',
        applyStatus: 'applied',
        eventStartAt: '2026-06-14T09:00:00',
        eventEndAt: '2026-06-14T10:00:00',
    },
    {
        cid: 'mock-calendar-3',
        policyId: '4',
        title: '역세권 청년주택 (SH)',
        org: '서울주택도시공사(SH)',
        applyStatus: '결과 대기',
        eventStartAt: '2026-06-21T09:00:00',
        eventEndAt: '2026-06-21T10:00:00',
    },
];

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
    if (USE_MOCK) return MOCK_CALENDAR_EVENTS;
    return apiClient.get<CalendarEvent[]>('/calendar/events');
}

export async function createCalendarEventFromPolicy(
    policyId: string,
): Promise<CalendarEvent> {
    if (USE_MOCK) {
        return MOCK_CALENDAR_EVENTS.find((event) => event.policyId === policyId) ?? {
            cid: `mock-calendar-${policyId}`,
            policyId,
            title: '목업 정책',
            org: '지원기관 미상',
            applyStatus: '지원 필요',
            eventStartAt: new Date().toISOString(),
            eventEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
    }

    return apiClient.post<CalendarEvent>(`/calendar/events/from-policy/${policyId}`);
}

export async function updateCalendarEventStatus(
    cid: string | number,
    applyStatus: CalendarApplyStatus,
): Promise<CalendarEvent> {
    if (USE_MOCK) {
        const event = MOCK_CALENDAR_EVENTS.find((item) => String(item.cid) === String(cid));
        if (event) {
            event.applyStatus = applyStatus;
            return event;
        }
        throw new Error('일정을 찾을 수 없습니다.');
    }

    return apiClient.put<CalendarEvent>(`/calendar/events/${cid}/status`, { applyStatus });
}

export async function deleteCalendarEvent(cid: string | number): Promise<DeleteCalendarEventResponse> {
    if (USE_MOCK) {
        console.info('[mock] delete calendar event', cid);
        return { deleted: true };
    }

    return apiClient.delete<DeleteCalendarEventResponse>(`/calendar/events/${cid}`);
}
