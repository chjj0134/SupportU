import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChecklist, updateChecklistItem } from '../checklist';
import { queryKeys } from '../../lib/queryClient';
import type { ChecklistItem } from '../types';

export function useChecklist() {
  return useQuery({
    queryKey: queryKeys.checklist.list(),
    queryFn: fetchChecklist,
  });
}

/**
 * 체크리스트 항목 toggle mutation - optimistic update.
 * 체크박스 클릭은 즉각 피드백이 중요하므로 서버 응답 기다리지 않고 UI 갱신.
 */
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; done: boolean }, { previous?: ChecklistItem[] }>({
    mutationFn: ({ id, done }) => updateChecklistItem(id, done),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.checklist.list() });
      const previous = queryClient.getQueryData<ChecklistItem[]>(queryKeys.checklist.list());
      if (previous) {
        queryClient.setQueryData<ChecklistItem[]>(
          queryKeys.checklist.list(),
          previous.map((item) => (item.id === id ? { ...item, done } : item)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.checklist.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checklist.list() });
    },
  });
}
