import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createCalendarEventFromPolicy,
    deleteCalendarEvent,
    fetchCalendarEvents,
    updateCalendarEventStatus,
} from '../calendar';
import { queryKeys } from '../../lib/queryClient';

export function useCalendarEvents() {
    return useQuery({
        queryKey: queryKeys.calendar.events(),
        queryFn: fetchCalendarEvents,
        retry: false,
    });
}

export function useCreateCalendarEventFromPolicy() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCalendarEventFromPolicy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
        },
    });
}

export function useDeleteCalendarEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cid: string | number) => deleteCalendarEvent(cid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
        },
    });
}

export function useUpdateCalendarEventStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ cid, applyStatus }: { cid: string | number; applyStatus: 'pending' | 'apply_now' | 'applied' | 'benefited' }) =>
            updateCalendarEventStatus(cid, applyStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.calendar.events() });
        },
    });
}
