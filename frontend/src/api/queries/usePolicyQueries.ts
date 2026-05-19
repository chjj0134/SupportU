import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPolicies,
  fetchPolicyDetail,
  fetchRecommendedPolicies,
  fetchBookmarkedPolicies,
  fetchScrappedPolicies,
  togglePolicyBookmark,
} from '../policies';
import { queryKeys } from '../../lib/queryClient';
import type { Policy } from '../types';

export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policies.list(),
    queryFn: fetchPolicies,
  });
}

export function usePolicyDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.policies.detail(id ?? ''),
    queryFn: () => fetchPolicyDetail(id!),
    // id가 없으면 쿼리를 발사하지 않는다 (조건부 fetching)
    enabled: !!id,
  });
}

export function useRecommendedPolicies() {
  return useQuery({
    queryKey: queryKeys.policies.recommended(),
    queryFn: fetchRecommendedPolicies,
  });
}

export function useBookmarkedPolicies() {
  return useQuery({
    queryKey: queryKeys.policies.bookmarked(),
    queryFn: fetchBookmarkedPolicies,
  });
}

export function useScrappedPolicies() {
  return useQuery({
    queryKey: queryKeys.policies.scrapped(),
    queryFn: fetchScrappedPolicies,
  });
}

/**
 * 북마크 토글 mutation - optimistic update 패턴 적용.
 * 사용자 클릭 즉시 UI에 반영하고, 실패 시 롤백한다.
 */
export function useTogglePolicyBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousList?: Policy[] }>({
    mutationFn: togglePolicyBookmark,
    onMutate: async (policyId) => {
      // 진행 중인 쿼리를 취소해 race condition 방지
      await queryClient.cancelQueries({ queryKey: queryKeys.policies.list() });
      const previousList = queryClient.getQueryData<Policy[]>(queryKeys.policies.list());
      if (previousList) {
        queryClient.setQueryData<Policy[]>(
          queryKeys.policies.list(),
          previousList.map((p) =>
            p.id === policyId ? { ...p, bookmarked: !p.bookmarked } : p,
          ),
        );
      }
      return { previousList };
    },
    onError: (_err, _policyId, context) => {
      // 실패 시 이전 상태로 롤백
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.policies.list(), context.previousList);
      }
    },
    onSettled: () => {
      // 서버 상태로 최종 동기화
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all() });
    },
  });
}
