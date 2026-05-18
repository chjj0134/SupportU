import { apiClient, ApiError, NetworkError } from './client';
import type { AuthUser } from './types';

/**
 * 현재 로그인된 사용자 조회.
 * - 로그인 안 됨 (401): null 반환 (정상 케이스)
 * - 네트워크 에러: throw (상위에서 처리 — 백엔드 다운 등)
 * - 기타 에러: throw
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    return await apiClient.get<AuthUser>('/auth/success');
  } catch (err) {
    if (err instanceof ApiError && err.isUnauthorized) return null;
    if (err instanceof NetworkError) {
      console.warn('[auth] 백엔드 연결 실패 - 로그아웃 상태로 처리:', err.message);
      return null;
    }
    throw err;
  }
}

/** Google OAuth2 로그인 시작 - 백엔드 Spring Security로 리다이렉트 */
export function initiateGoogleLogin(): void {
  window.location.href = '/oauth2/authorization/google';
}

/** 로그아웃 (백엔드 세션 무효화 후 페이지 리로드) */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/logout');
  } finally {
    window.location.href = '/';
  }
}
