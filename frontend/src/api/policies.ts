import { apiClient } from './client';
import { withMock } from './config';
import type { Policy, PolicyDetail } from './types';
import {
  MOCK_POLICIES,
  MOCK_POLICY_DETAILS,
  MOCK_SCRAPPED,
} from './__mocks__/policies.mock';

export interface ScrappedPolicy {
  id: string;
  title: string;
  category: string;
  deadline: string;
  support: string;
  org: string;
  amount: string;
  scope: string;
  duration: string;
  target: string;
  method: string;
}

export function fetchPolicies(): Promise<Policy[]> {
  return withMock(
    () => MOCK_POLICIES,
    () => apiClient.get<Policy[]>('/policies'),
  );
}

export function fetchPolicyDetail(id: string): Promise<PolicyDetail | null> {
  return withMock(
    () => MOCK_POLICY_DETAILS[id] ?? null,
    () => apiClient.get<PolicyDetail>(`/policies/${id}`),
  );
}

export function fetchRecommendedPolicies(): Promise<Policy[]> {
  return withMock(
    () => MOCK_POLICIES.slice(0, 3),
    () => apiClient.get<Policy[]>('/policies/recommended'),
  );
}

export function fetchBookmarkedPolicies(): Promise<Policy[]> {
  return withMock(
    () => MOCK_POLICIES.filter((p) => p.bookmarked),
    () => apiClient.get<Policy[]>('/policies/bookmarked'),
  );
}

export function togglePolicyBookmark(id: string, bookmarked: boolean): Promise<void> {
  return withMock(
    () => { console.info('[mock] toggle bookmark', id, bookmarked); },
    async () => {
      if (bookmarked) {
        await apiClient.delete(`/policies/${id}/bookmark`);
      } else {
        await apiClient.post(`/policies/${id}/bookmark`);
      }
    },
  );
}

export function fetchScrappedPolicies(): Promise<ScrappedPolicy[]> {
  return withMock(
    () => MOCK_SCRAPPED,
    () => apiClient.get<ScrappedPolicy[]>('/policies/scrapped'),
  );
}
