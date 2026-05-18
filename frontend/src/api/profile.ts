import { apiClient } from './client';
import type { ProfileRequest, ProfileResponse } from './types';

// 내 프로필 조회
export async function getProfile(): Promise<ProfileResponse | null> {
  try {
    return await apiClient.get<ProfileResponse>('/profile/me');
  } catch {
    return null;
  }
}

// 프로필 저장 (회원가입 완료 시)
export async function saveProfile(data: ProfileRequest): Promise<ProfileResponse> {
  return apiClient.post<ProfileResponse>('/profile/me', data);
}
