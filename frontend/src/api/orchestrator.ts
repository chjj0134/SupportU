import { apiClient } from './client';
import type {
  PrecomputeEligibilityRequest,
  PrecomputeEligibilityResponse,
  DocumentExtractRequest,
  DocumentExtractResponse,
  BenefitRequest,
  BenefitResponse,
  SyncPolicyRequest,
  SyncPolicyResponse,
} from './types';

/* 1. 맞춤 정책 사전 계산 (자격 검증 에이전트) */
export async function precomputeEligibility(data: PrecomputeEligibilityRequest) {
  return apiClient.post<PrecomputeEligibilityResponse>('/orchestrator/precompute-eligibility', data);
}

/* 2. 정책 서류 추출 (서류 에이전트) */
export async function extractPolicyDocuments(data: DocumentExtractRequest) {
  return apiClient.post<DocumentExtractResponse>('/orchestrator/extract-policy-documents', data);
}

/* 3. 혜택 요약 (기대효과 에이전트) */
export async function calculateTotalBenefit(data: BenefitRequest) {
  return apiClient.post<BenefitResponse>('/orchestrator/total-benefit', data);
}

/* 4. 신규 정책 동기화 (싱크 에이전트) */
export async function syncNewPolicy(data: SyncPolicyRequest) {
  return apiClient.post<SyncPolicyResponse>('/orchestrator/sync-new-policy', data);
}