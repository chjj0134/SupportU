import { apiClient } from './client';
import { withMock } from './config';
import type { ProfileRequest, ProfileResponse } from './types';
import { MOCK_PROFILE } from './__mocks__/profile.mock';

const MOCK_AUTH_STORAGE_KEY = 'supportu-mock-auth';

export function getProfile(): Promise<ProfileResponse | null> {
  return withMock(
    () => MOCK_PROFILE,
    async () => {
      try {
        return await apiClient.get<ProfileResponse>('/profiles/me');
      } catch {
        return null;
      }
    },
  );
}

export function saveProfile(data: ProfileRequest): Promise<ProfileResponse> {
  return withMock(
    () => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, '1');
      }
      return { uid: 'mock-google-id-12345', createdAt: new Date().toISOString(), ...data };
    },
    () => apiClient.put<ProfileResponse>('/profiles/me', data),
  );
}
