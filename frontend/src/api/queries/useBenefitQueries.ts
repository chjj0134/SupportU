import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBenefitSummary, triggerTotalBenefit } from '../benefits';
import { queryKeys } from '../../lib/queryClient';

export function useBenefitSummary(userId?: string | null) {
    return useQuery({
        queryKey: queryKeys.benefits.summary(userId ?? ''),
        queryFn: () => getBenefitSummary(userId ?? ''),
        enabled: !!userId,
        retry: false,
    });
}

export function useTriggerTotalBenefit(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => triggerTotalBenefit({ uid: userId ?? '' }),
        onSuccess: () => {
            if (userId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.benefits.summary(userId) });
            }
        },
    });
}