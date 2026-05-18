import { apiClient, ApiError } from './client';
import type { AuthUser } from './types';

// 현재 로그인된 사용자 정보 조회
// 로그인되지 않은 경우 null 반환
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    return await apiClient.get<AuthUser>('/auth/success');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return null;
  }
}

// Google OAuth2 로그인 시작 - 백엔드 Spring Security로 리다이렉트
export function initiateGoogleLogin() {
  window.location.href = '/oauth2/authorization/google';
}

// 로그아웃
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {});
}
