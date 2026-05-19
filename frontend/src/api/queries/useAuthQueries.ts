import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthUser, logout, initiateGoogleLogin } from '../auth';
import { queryKeys } from '../../lib/queryClient';

/**
 * 현재 로그인된 사용자 조회.
 * - null → 미로그인 (정상 케이스, 에러 아님)
 * - getAuthUser는 어떤 에러도 throw하지 않으므로 retry 불필요.
 */
export function useAuthUser() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: getAuthUser,
    staleTime: 1000 * 60 * 5, // 5분
    retry: false, // 실패는 곧 "미로그인" 의미. 재시도해도 결과 같음.
  });
}

/**
 * 로그인 상태 변화 시 모든 쿼리를 invalidate해서
 * 권한 의존 데이터(북마크, 추천 등)가 갱신되도록 한다.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
}

// 페이지 전체 리다이렉트가 발생하므로 mutation이 아닌 일반 함수로 노출
export { initiateGoogleLogin };
