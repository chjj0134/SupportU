import { apiClient } from './client';
import { withMock } from './config';
import { MOCK_BENEFIT_SUMMARY } from './__mocks__/benefits.mock';

export interface ServiceBenefitResponse {
  benefitType: string | null;
  benefitItem: string | null;
  effectSummary: string | null;
}

export interface BenefitSummaryResponse {
  totalBenefitAmount: number;
  benefitPeriodText: string;
  serviceBenefits: ServiceBenefitResponse[];
}

export interface TotalBenefitRequest {
  uid: string;
}

export function getBenefitSummary(userId: string): Promise<BenefitSummaryResponse> {
  return withMock(
    () => MOCK_BENEFIT_SUMMARY,
    () => apiClient.get<BenefitSummaryResponse>(`/v1/users/${userId}/benefits/summary`),
  );
}

export function triggerTotalBenefit(request: TotalBenefitRequest): Promise<void> {
  return withMock(
    () => { console.info('[mock] triggerTotalBenefit', request.uid); },
    () => apiClient.post<void>('/orchestrator/total-benefit', request),
  );
}
